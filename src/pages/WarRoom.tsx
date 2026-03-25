import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Clock, 
  MoreHorizontal 
} from 'lucide-react';
import { format, isAfter, setHours, setMinutes, startOfToday } from 'date-fns';
import { logActivity } from '../lib/activityLogger';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useNotificationStore } from '../store/notificationStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { notificationService } from '../lib/notificationService';
import { useRealtimeSync } from '../hooks/useRealtimeSync';

export const WarRoom = () => {
  useRealtimeSync();

  const { currentUser, currentTenantId: tenantId } = useWorkspaceStore();
  const { addNotification } = useNotificationStore();
  const queryClient = useQueryClient();
  const [eodStatus, setEodStatus] = useState<'locked' | 'open' | 'submitted' | 'modaling'>('locked');
  const [eodText, setEodText] = useState('');
  const [now, setNow] = useState(new Date());
  
  const [myPresence, setMyPresence] = useState('Online');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const [tenantRes, usersRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', tenantId).single(),
        supabase.from('users').select('*').eq('tenant_id', tenantId)
      ]);
      if (tenantRes.error) throw tenantRes.error;
      return { tenant: tenantRes.data, users: usersRes.data || [] };
    },
    enabled: !!tenantId
  });

  const { taskVelocityData, setTaskVelocityData } = useWorkspaceStore();
  const { data: warRoomData, isLoading } = useQuery({
    queryKey: ['war-room', tenantId, currentUser?.id],
    queryFn: async () => {
      const [blockersRes, eodRes, reportsRes] = await Promise.all([
        supabase.from('blockers').select('*, users(name)').eq('tenant_id', tenantId),
        supabase.from('eod_reports').select('id').eq('tenant_id', tenantId).eq('author_id', currentUser?.id).eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('eod_reports').select('*, users(name)').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(5)
      ]);
      return { 
        blockers: blockersRes.data || [], 
        hasSubmittedEod: (eodRes.data?.length ?? 0) > 0,
        recentReports: reportsRes.data || []
      };
    },
    enabled: !!tenantId && !!currentUser
  });

  const activeUsers = dashboardData?.users || [];
  const blockers = warRoomData?.blockers || [];

  useEffect(() => {
    const checkEod = () => {
      const lockTime = setMinutes(setHours(startOfToday(), 16), 0);
      if (warRoomData?.hasSubmittedEod) return setEodStatus('submitted');
      setEodStatus(prev => {
        if (prev === 'submitted' || prev === 'modaling') return prev;
        return isAfter(new Date(), lockTime) ? 'open' : 'locked';
      });
    };
    checkEod();
    const timer = setInterval(() => { setNow(new Date()); checkEod(); }, 60000);
    return () => clearInterval(timer);
  }, [warRoomData?.hasSubmittedEod]);

  const addBlocker = useMutation({
    mutationFn: async (args: any) => {
      const { data, error } = await supabase.from('blockers').insert([{
        tenant_id: tenantId,
        author_id: currentUser?.id,
        task: args.task,
        blocker_text: args.blocker_text,
        is_escalated: args.is_escalated
      }]).select();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['war-room'] });
      if (data && data[0] && tenantId && currentUser) {
        notificationService.notifyTeam(
          tenantId,
          currentUser.id,
          '🚨 New Blocker Alert',
          `${currentUser.name} added a blocker: ${data[0].blocker_text}`
        );
        logActivity(tenantId!, currentUser?.id, 'BLOCKER_ESCALATED');
      }
    }
  });

  const resolveBlocker = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('blockers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setActiveDropdown(null);
      queryClient.invalidateQueries({ queryKey: ['war-room'] });
      addNotification('SUCCESS', 'Blocker explicitly unblocked & purged.');
    }
  });

  const submitEod = useMutation({
    mutationFn: async (report_text: string) => {
      const { error } = await supabase.from('eod_reports').insert([{
        tenant_id: tenantId,
        author_id: currentUser?.id,
        report_text,
        date: new Date().toISOString().split('T')[0]
      }]);
      if (error) throw error;
    },
    onSuccess: (_, report_text) => { // The second argument to onSuccess is the variables passed to mutationFn
      setEodStatus('submitted');
      addNotification('SUCCESS', 'EOD report submitted! Great work today.');
      addNotification('EOD_REPORT', `${currentUser?.name || 'A team member'} submitted their EOD`, { text: report_text });
      queryClient.invalidateQueries({ queryKey: ['war-room'] });
      logActivity(tenantId!, currentUser?.id, 'EOD_SUBMITTED');
    }
  });

  const handleReportBlocker = () => {
    const task = window.prompt("What task is blocked?");
    if (!task) return;
    const blockerText = window.prompt("What is the blocker?");
    if (!blockerText) return;
    const escalated = window.confirm("Is this escalated? (OK for Yes, Cancel for No)");
    addBlocker.mutate({ task, blocker_text: blockerText, is_escalated: escalated });
  };

  const handleOpenEod = () => {
    setEodStatus('modaling');
  };

  const handleSubmitEod = () => {
    if (!eodText.trim()) return;
    submitEod.mutate(eodText);
  };

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold">War Room</h2>
        <p className="text-zinc-500 text-sm mt-1">Real-time team accountability and blocker management.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Status Grid */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white/5 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Users size={16} /> Active Team Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeUsers.map((member: any) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs ring-2 ring-zinc-700">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{member.name}</p>
                      <p className="text-[10px] text-zinc-500">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.id === currentUser?.id ? (
                      <select 
                        value={myPresence}
                        onChange={(e) => setMyPresence(e.target.value)}
                        className={`text-[10px] font-bold uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer ${
                          myPresence === 'Online' ? 'text-emerald-500' :
                          myPresence === 'Focusing' ? 'text-indigo-500' : 'text-zinc-500'
                        }`}
                      >
                        <option value="Online">Online</option>
                        <option value="Focusing">Focusing</option>
                        <option value="Offline">Offline</option>
                      </select>
                    ) : (
                      <>
                        <div className={`w-2 h-2 rounded-full ${
                          member.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 
                          member.status === 'Focusing' ? 'bg-indigo-500' : 'bg-zinc-600'
                        }`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{member.status || 'Offline'}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {activeUsers.length === 0 && <p className="text-sm text-zinc-500">No active users found.</p>}
            </div>
          </section>

          {/* Blocker Feed */}
          <section className="bg-white/5 border border-zinc-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-500" /> Blocker Feed
              </h3>
              <button 
                onClick={handleReportBlocker} 
                disabled={addBlocker.isPending}
                className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50"
              >
                + Report Blocker
              </button>
            </div>
            <div className="space-y-4">
              {blockers.map((blocker: any) => (
                <div key={blocker.id} className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start justify-between relative">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                      <Zap size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{blocker.user}</p>
                        {blocker.escalated && <span className="text-[8px] px-1.5 py-0.5 bg-rose-500/20 text-rose-500 rounded font-bold uppercase">Escalated</span>}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{blocker.task}</p>
                      <p className="text-sm text-rose-200/70 mt-3 italic">"{blocker.blocker}"</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setActiveDropdown(activeDropdown === blocker.id ? null : blocker.id)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                      <MoreHorizontal size={16} className="text-zinc-500" />
                    </button>
                    {activeDropdown === blocker.id && (
                      <div className="absolute top-full right-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl p-1 z-50 shadow-xl">
                        <button onClick={() => resolveBlocker.mutate(blocker.id)} disabled={resolveBlocker.isPending} className="w-full text-left px-3 py-2 text-sm text-emerald-500 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50">
                          Resolve Blocker
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {blockers.length === 0 && (
                <div className="text-center py-6 border border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-emerald-500 font-bold text-sm">Clear skies! No active blockers.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* EOD Module */}
        <div className="space-y-6">
          <section className="bg-white/5 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${
              eodStatus === 'locked' ? 'bg-zinc-800 text-zinc-600' : 
              eodStatus === 'open' ? 'bg-emerald-500/10 text-emerald-500 ring-2 ring-emerald-500/20' : 
              'bg-indigo-500/10 text-indigo-500'
            }`}>
              {eodStatus === 'locked' ? <Lock size={32} /> : 
               eodStatus === 'open' ? <CheckCircle2 size={32} /> : <Zap size={32} />}
            </div>
            
            <h3 className="text-lg font-bold">End of Day Report</h3>
            <p className="text-zinc-500 text-sm mt-2 mb-8">
              {eodStatus === 'locked' ? "EOD submission opens at 4:00 PM local time." : 
               eodStatus === 'open' ? "Wrap up your day and submit your progress report." : 
               "Great work today! Your report has been dispatched to the team."}
            </p>

            <div className="w-full space-y-4">
              <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl border border-zinc-800 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <Clock size={14} /> Local Time
                </div>
                <span className="font-bold text-white">{format(now, 'HH:mm')}</span>
              </div>

              {eodStatus === 'open' && (
                <button 
                  onClick={handleOpenEod}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2"
                >
                  <Zap size={18} /> Submit EOD Now
                </button>
              )}

              {eodStatus === 'locked' && (
                <button 
                  disabled
                  className="w-full py-4 bg-zinc-800 text-zinc-600 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock size={16} /> Locked
                </button>
              )}

              {eodStatus === 'submitted' && (
                <div className="py-4 bg-indigo-500/20 text-indigo-400 rounded-2xl font-bold border border-indigo-500/30 flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> Submitted
                </div>
              )}
            </div>
          </section>

          {/* Recent EOD Reports */}
          <section className="bg-white/5 border border-zinc-800 rounded-3xl p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Clock size={14} /> Recent Team EODs
            </h3>
            <div className="space-y-3">
              {(warRoomData as any)?.recentReports?.map((report: any) => (
                <div key={report.id} className="p-3 bg-white/5 rounded-xl border border-zinc-800/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-white">{report.users?.name || 'Unknown User'}</span>
                    <span className="text-[9px] text-zinc-600">{format(new Date(report.created_at), 'HH:mm')}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 italic line-clamp-2">"{report.report_text}"</p>
                </div>
              ))}
              {(!warRoomData as any)?.recentReports?.length && (
                <p className="text-[10px] text-zinc-600 italic">No reports submitted today.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {eodStatus === 'modaling' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1C] border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-2">Today's Achievements</h2>
            <p className="text-zinc-500 text-sm mb-6">What did you actually get done today? Drop your highlight reel.</p>
            <textarea 
              value={eodText}
              onChange={(e) => setEodText(e.target.value)}
              className="w-full bg-black/20 border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none focus:border-emerald-500 resize-none min-h-[120px]"
              placeholder="- Shipped 4 new API routes&#10;- Fixed the layout bugs&#10;- Closed 2 PRs"
            />
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={() => setEodStatus('open')} 
                className="flex-1 py-3 px-4 rounded-xl font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitEod}
                disabled={!eodText.trim() || submitEod.isPending}
                className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold transition-colors"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
