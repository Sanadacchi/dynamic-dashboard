import React, { useState } from 'react';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { Zap, ChevronRight, Check, Pencil, Search, Users, Book } from 'lucide-react';
import { PERSONA_DATA, PersonaType } from '../personaConfig';
import { supabase } from '../lib/supabase';

export const LoginScreen = ({ onLogin }: { onLogin: (tenantId: number, userId: number, name: string) => void }) => {
  const queryClient = useQueryClient();
  const { data: tenants, isLoading: loadingTenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tenants').select('*');
      if (error) throw error;
      return data;
    }
  });

  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  
  // Secure Invite Code Flow
  const [inviteCode, setInviteCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [foundGroup, setFoundGroup] = useState<any | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const verifyInviteCode = async (code: string) => {
    setIsVerifying(true);
    setInviteError(null);
    setFoundGroup(null);

    // Find tenant by exact name match (case-insensitive for better UX, but requiring the full string)
    const { data: matchedTenants, error } = await supabase
      .from('tenants')
      .select('*')
      .ilike('name', code.trim());

    if (error) {
      setInviteError("Error verifying invite code.");
      setIsVerifying(false);
      return;
    }

    const matchedTenant = matchedTenants?.[0];

    if (matchedTenant) {
      setFoundGroup(matchedTenant);
    } else {
      setInviteError("Invalid or expired invite code.");
    }
    setIsVerifying(false);
  };
  
  const { data: dashboardData, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard', selectedTenantId],
    queryFn: async () => {
      if (!selectedTenantId) return null;
      const [tenantRes, usersRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', selectedTenantId).single(),
        supabase.from('users').select('*').eq('tenant_id', selectedTenantId)
      ]);
      if (tenantRes.error) throw tenantRes.error;
      if (usersRes.error) throw usersRes.error;
      return { tenant: tenantRes.data, users: usersRes.data };
    },
    enabled: !!selectedTenantId
  });

  const [newTenantName, setNewTenantName] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("Tech");
  
  // Custom Trackers
  const defaultChips = PERSONA_DATA[selectedPersona].defaultChips;
  const [tracker1, setTracker1] = useState(defaultChips.chip_1);
  const [tracker2, setTracker2] = useState(defaultChips.chip_2);

  const createTenant = useMutation({
    mutationFn: async (data: { name: string, companyType: string, primaryColor: string, customLabels: any }) => {
      const { data: newTenant, error } = await supabase
        .from('tenants')
        .insert([{
          name: data.name,
          company_type: data.companyType,
          primary_color: data.primaryColor,
          custom_labels: data.customLabels,
          persona: data.companyType
        }])
        .select()
        .single();
      if (error) throw error;
      return newTenant;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setSelectedTenantId(Number(data.id));
    }
  });

  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("Contributor");
  const createUser = useMutation({
    mutationFn: async (name: string) => {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          tenant_id: selectedTenantId,
          name,
          role: newUserRole || 'Contributor',
          status: 'Offline'
        }])
        .select()
        .single();
      if (error) throw error;
      return newUser;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
      onLogin(selectedTenantId!, Number(data.id), data.name);
    }
  });

  const [editingRoleUserId, setEditingRoleUserId] = useState<number | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState("");
  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id);
      if (error) throw error;
      return { id, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', selectedTenantId] });
      setEditingRoleUserId(null);
    }
  });

  const commitRoleEdit = (userId: number) => {
    const trimmed = editingRoleValue.trim();
    if (trimmed) updateRole.mutate({ id: userId, role: trimmed });
    else setEditingRoleUserId(null);
  };

  if (loadingTenants) return <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center"><Zap size={48} className="text-white animate-pulse" /></div>;

  return (
    <div className="min-h-screen bg-[#1C1C1C] text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white/5 border border-zinc-800 rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Zap size={20} className="text-black" />
          </div>
          <span className="font-bold text-2xl">Grahamly</span>
        </div>

        {!selectedTenantId ? (
          <div>
            <h3 className="text-lg font-bold mb-1">Join Group</h3>
            <p className="text-xs text-zinc-500 mb-6">Enter your private invite code to access your workspace.</p>

            {/* Invite Code Input */}
            <div className="space-y-4 mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  value={inviteCode}
                  onChange={e => {
                    setInviteCode(e.target.value);
                    if (inviteError) setInviteError(null);
                    if (foundGroup) setFoundGroup(null);
                  }}
                  onKeyDown={e => e.key === 'Enter' && inviteCode && verifyInviteCode(inviteCode)}
                  placeholder="Invite Code (e.g. XXXX-XXXX)"
                  className={`flex-1 bg-white/5 border ${inviteError ? 'border-rose-500/50' : 'border-zinc-800'} rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 placeholder-zinc-600 transition-colors uppercase`}
                />
                <button 
                  onClick={() => inviteCode && verifyInviteCode(inviteCode)}
                  disabled={!inviteCode || isVerifying}
                  className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 min-w-[90px]"
                >
                  {isVerifying ? <Zap size={14} className="animate-pulse" /> : <Check size={14} />}
                  <span>{isVerifying ? 'Verifying' : 'Verify'}</span>
                </button>
              </div>

              {inviteError && (
                <p className="text-[11px] text-rose-500 font-medium px-1 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  {inviteError}
                </p>
              )}

              {foundGroup && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                        <Users size={18} className="text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Workspace Found</p>
                        <p className="font-bold text-sm truncate text-white">{foundGroup.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTenantId(foundGroup.id)}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap"
                    >
                      Join Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider font-bold">Create New Group</p>
              
              <div className="space-y-4">
                <input type="text" value={newTenantName} onChange={e => setNewTenantName(e.target.value)} placeholder="Company Name" className="w-full bg-white/5 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-white/20" />
                
                {/* Persona Switcher */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-2">Select Persona</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
                    {(Object.keys(PERSONA_DATA) as PersonaType[]).map((key) => {
                      const persona = PERSONA_DATA[key];
                      const Icon = persona.icon;
                      const isSelected = selectedPersona === key;
                      return (
                        <div 
                          key={key} 
                          onClick={() => {
                            setSelectedPersona(key);
                            setTracker1(PERSONA_DATA[key].defaultChips.chip_1);
                            setTracker2(PERSONA_DATA[key].defaultChips.chip_2);
                          }}
                          className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${isSelected ? `border-${persona.color}-500 bg-${persona.color}-500/10 text-${persona.color}-500` : 'border-zinc-800 bg-white/5 text-zinc-400 hover:border-zinc-700'}`}
                        >
                          <Icon size={20} />
                          <span className="text-[10px] font-bold text-center leading-tight">{persona.label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Define Trackers */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 mb-2">Define Custom Trackers</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={tracker1} 
                      onChange={e => setTracker1(e.target.value)} 
                      placeholder="Tracker 1 Label" 
                      className="w-full bg-white/5 border border-zinc-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-white/20" 
                    />
                    <input 
                      type="text" 
                      value={tracker2} 
                      onChange={e => setTracker2(e.target.value)} 
                      placeholder="Tracker 2 Label" 
                      className="w-full bg-white/5 border border-zinc-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-white/20" 
                    />
                  </div>
                </div>

                <button 
                  onClick={() => newTenantName && createTenant.mutate({ 
                    name: newTenantName, 
                    companyType: PERSONA_DATA[selectedPersona].label,
                    primaryColor: PERSONA_DATA[selectedPersona].color,
                    customLabels: { chip_1: tracker1, chip_2: tracker2 }
                  })} 
                  className={`w-full bg-${PERSONA_DATA[selectedPersona].color === 'white' ? 'white text-black' : `${PERSONA_DATA[selectedPersona].color}-500 text-white`} px-4 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
                >
                  <Check size={16} />
                  Initialize Group
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4 text-zinc-500 cursor-pointer hover:text-white" onClick={() => setSelectedTenantId(null)}>
              <ChevronRight size={16} className="rotate-180" />
              <span className="text-sm">Back to groups</span>
            </div>
            <h3 className="text-lg font-bold mb-4">Who's logging in?</h3>
            {loadingDashboard ? (
               <div className="py-8 flex justify-center"><Zap size={24} className="text-white animate-pulse" /></div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {dashboardData?.users?.map((u: any) => (
                    <div key={u.id} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-zinc-800">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer" onClick={() => onLogin(selectedTenantId, u.id, u.name)}>
                        {u.name.charAt(0)}
                      </div>
                      <div className="text-left flex-1 cursor-pointer" onClick={() => onLogin(selectedTenantId, u.id, u.name)}>
                        <p className="font-bold text-sm">{u.name}</p>
                        {editingRoleUserId === u.id ? (
                          <input
                            autoFocus
                            className="text-[10px] bg-white/10 border border-zinc-700 rounded px-1 py-0.5 text-white outline-none w-28"
                            value={editingRoleValue}
                            onChange={e => setEditingRoleValue(e.target.value)}
                            onBlur={() => commitRoleEdit(u.id)}
                            onKeyDown={e => { if (e.key === 'Enter') commitRoleEdit(u.id); if (e.key === 'Escape') setEditingRoleUserId(null); }}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <p className="text-[10px] text-zinc-500">{u.role}</p>
                        )}
                      </div>
                      <button
                        title="Edit role"
                        onClick={e => { e.stopPropagation(); setEditingRoleUserId(u.id); setEditingRoleValue(u.role ?? ''); }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => onLogin(selectedTenantId, u.id, u.name)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-xs font-bold text-white transition-all shrink-0"
                      >
                        Login
                      </button>
                    </div>
                  ))}
                  {dashboardData?.users?.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No users found.</p>}
                </div>
                <div className="border-t border-zinc-800 pt-6">
                  <p className="text-xs text-zinc-500 mb-3 uppercase tracking-wider font-bold">Join as New User</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-white/5 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-white/20"
                    />
                    <input
                      type="text"
                      value={newUserRole}
                      onChange={e => setNewUserRole(e.target.value)}
                      placeholder="Your Role (e.g. Designer, Lead Dev…)"
                      className="w-full bg-white/5 border border-zinc-800 rounded-lg px-4 py-2 text-sm outline-none focus:border-white/20"
                    />
                    <button
                      onClick={() => newUserName && createUser.mutate(newUserName)}
                      disabled={!newUserName}
                      className="w-full bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Join Group
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating User Guide Link */}
      <a 
        href="https://hucpcyfbjsbvrjcnocil.supabase.co/storage/v1/object/public-assets/Dashboard-userguide.pdf" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 left-8 flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-zinc-800 hover:border-zinc-600 backdrop-blur-md rounded-2xl text-zinc-400 hover:text-white transition-all group z-[100]"
      >
        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
          <Book size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300">Resources</span>
          <span className="text-xs font-bold">User Guide</span>
        </div>
      </a>
    </div>
  );
};
