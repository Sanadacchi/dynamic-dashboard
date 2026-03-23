import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Target, 
  Plus,
  Pencil
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, LineChart, Line, BarChart, Bar } from 'recharts';
import { useWorkspaceStore } from '../store/workspaceStore';
import { WidgetCard } from '../components/WidgetCard';
import { MetricBuilderModal } from '../components/MetricBuilderModal';
import { ContextMenu } from '../components/ContextMenu';
import { EditPanelModal } from '../components/EditPanelModal';
import { UniversalLineChart } from '../components/UniversalLineChart';
import { useLayoutStore } from '../store/layoutStore';
import { supabase } from '../lib/supabase';
import { useWidgetData } from '../hooks/useWidgetData';
import { PERSONA_DATA, PersonaType, TREND_ICON, TREND_COLOR } from '../personaConfig';
import { lineData } from '../mockData';
import { WidgetConfig, CustomWidget } from '../types';

export const Overview = () => {
  const navigate = useNavigate();
  const { currentTenantId: tenantId, currentUser, setCurrentUser, setTenantId } = useWorkspaceStore();
  const queryClient = useQueryClient();

  const taskVelocityData = useWidgetData({ sourceType: 'MANUAL', manualDataKey: 'taskVelocity' });
  const apiRequestsData = useWidgetData({ sourceType: 'API', endpoint: '/api/metrics/live', refetchInterval: 5000 });

  const handleLogout = () => {
    setCurrentUser(null);
    setTenantId(null);
    navigate('/');
  };
  
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).single();
      if (error) throw error;
      return { 
        tenant: data,
        dailyGoal: {
          goal_text: data.north_star_title,
          category: data.north_star_category || 'Strategic Target'
        }
      };
    },
    enabled: !!tenantId,
  });

  const { data: widgets, isLoading: loadingWidgets } = useQuery({
    queryKey: ['custom-widgets', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('custom_widgets')
        .select('*')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId
  });

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', tenantId],
    queryFn: async () => {
      const [tasksRes, blockersRes] = await Promise.all([
        supabase.from('tasks').select('status').eq('tenant_id', tenantId),
        supabase.from('blockers').select('is_escalated').eq('tenant_id', tenantId)
      ]);
      
      const allTasks = tasksRes.data || [];
      const allBlockers = blockersRes.data || [];
      
      return {
        activeTasks: allTasks.filter(t => t.status !== 'Done').length,
        completedTasks: allTasks.filter(t => t.status === 'Done').length,
        totalBlockers: allBlockers.length,
        escalatedBlockers: allBlockers.filter(b => b.is_escalated).length
      };
    },
    enabled: !!tenantId
  });

  const [isMetricBuilderOpen, setIsMetricBuilderOpen] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [goalCategory, setGoalCategory] = useState("Development");
  const [panelMenu, setPanelMenu] = useState<{ x: number; y: number; type: 'sidePanel' | 'chartPanel' | 'statusPanel' | 'velocityPanel' } | null>(null);
  const [editingPanel, setEditingPanel] = useState<'sidePanel' | 'chartPanel' | 'statusPanel' | 'velocityPanel' | null>(null);

  useEffect(() => {
    if (data?.dailyGoal?.goal_text) {
      setGoalText(data.dailyGoal.goal_text);
      setGoalCategory(data.dailyGoal.category || "Development");
    }
  }, [data]);

  const updateGoal = useMutation({
    mutationFn: async (goalData: { text: string, category: string }) => {
      const { error } = await supabase
        .from('tenants')
        .update({ north_star_title: goalData.text, north_star_category: goalData.category })
        .eq('id', tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', tenantId] });
    }
  });

  if (isLoading) return <div className="p-8">Loading dashboard...</div>;

  const layout: WidgetConfig[] = data?.tenant?.dashboard_layout ? JSON.parse(data.tenant.dashboard_layout) : [];
  const runwayDays = data?.tenant ? Math.floor(data.tenant.total_balance / data.tenant.daily_burn) : 0;
  const companyType = data?.tenant?.company_type || '';
  const personaKey = Object.keys(PERSONA_DATA).find(k =>
    companyType.includes(k) || k.includes(companyType)
  ) as keyof typeof PERSONA_DATA | undefined;
  const persona = personaKey ? PERSONA_DATA[personaKey] : PERSONA_DATA['Tech'];

  const overrides = data?.tenant?.custom_labels || {};
  const sidePanel = overrides.sidePanel ? { ...persona.sidePanel, ...overrides.sidePanel } : persona.sidePanel;
  const chartPanelLabel = overrides.chartPanel?.title ?? persona.chartLabel;
  const statusStat1 = overrides.statusPanel?.stats?.[0] ?? { label: persona.stat1.label, value: persona.stat1.value, sub: persona.stat1.sub };
  const statusStat2 = overrides.statusPanel?.stats?.[1] ?? { label: persona.stat2.label, value: persona.stat2.value, sub: persona.stat2.sub };
  const statusPanelTitle = overrides.statusPanel?.title ?? 'Status Snapshot';

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8">
      {/* Header & North Star */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center justify-between flex-1">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Dashboard Overview</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-zinc-500 text-sm">Welcome back, <span className="text-zinc-900 dark:text-white font-medium">{currentUser?.name || 'User'}</span></p>
              <button 
                onClick={handleLogout}
                className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-rose-500 transition-colors bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-800"
              >
                Logout
              </button>
            </div>
          </div>
          {layout.some(w => w.type === 'NORTH_STAR' && w.rolesRequired?.includes(currentUser?.role)) && (
            <div className="flex-1 max-w-xl ml-8">
              <div className="bg-white/5 border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
                <Target size={18} className="text-emerald-500 shrink-0" />
                <input 
                  type="text"
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  onBlur={() => goalText && updateGoal.mutate({ text: goalText, category: goalCategory })}
                  placeholder="Set the Daily North Star..."
                  className="bg-transparent border-none outline-none text-sm font-medium w-full placeholder:text-zinc-600"
                />
                <select 
                  value={goalCategory} 
                  onChange={e => {
                    setGoalCategory(e.target.value);
                    if (goalText) updateGoal.mutate({ text: e.target.value, category: data?.tenant?.north_star_category || 'Strategic Target' });
                  }}
                  className="bg-transparent border-none text-xs font-bold text-zinc-500 outline-none cursor-pointer max-w-[100px]"
                >
                  <option value="Development">Development</option>
                  <option value="Sales">Sales</option>
                  <option value="Creative">Creative</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid - Aligned 2x2 for Mobile from Template */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {widgets?.map((widget: CustomWidget) => (
          <WidgetCard widget={widget} />
        ))}
        <button 
          onClick={() => setIsMetricBuilderOpen(true)}
          className="bg-transparent border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-6 min-h-[160px] hover:border-zinc-600 hover:bg-white/5 transition-colors text-zinc-500 hover:text-white group"
        >
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus size={20} />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider">Add Metric</span>
        </button>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#F7F9FB] dark:bg-[#2C2C2C] rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Task Completion Velocity</h4>
            <div className="flex items-center gap-4">
              <select className="bg-transparent border-none text-xs font-bold text-zinc-500 outline-none cursor-pointer">
                <option>This Week</option>
                <option>This Month</option>
              </select>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPanel('velocityPanel'); }}
                className="p-2 -mr-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                 <Pencil size={11} />
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <UniversalLineChart 
              data={taskVelocityData.data}
              xAxisKey="label"
              lines={[
                { dataKey: 'current', strokeColor: '#6366f1' },
                { dataKey: 'previous', strokeColor: '#52525b', isDashed: true }
              ]}
            />
          </div>
        </div>

        {/* Persona Side Panel - Modified to reflect dynamic bound data */}
        <div
          onContextMenu={e => { e.preventDefault(); setPanelMenu({ x: e.clientX, y: e.clientY, type: 'sidePanel' }); }}
          className="relative group bg-[#F7F9FB] dark:bg-[#2C2C2C] rounded-3xl p-8 flex flex-col gap-6 select-none"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">{sidePanel.title}</h4>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPanel('sidePanel'); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg"
            >
              <Pencil size={11} />
            </button>
          </div>
          <div className="flex flex-col gap-5 flex-1 justify-center">
            {sidePanel.items.map((item: any, i: number) => {
              const TrendIconComp = TREND_ICON[item.trend as keyof typeof TREND_ICON];
              // Map dynamic numbers from real engine feed
              const valueMap: Record<number, number> = {
                0: stats?.activeTasks ?? 0,
                1: stats?.completedTasks ?? 0,
                2: stats?.totalBlockers ?? 0
              };
              const dynamicValue = valueMap[i] ?? 0;
              
              return (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{item.label}</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-white mt-0.5">{dynamicValue}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold ${TREND_COLOR[item.trend as keyof typeof TREND_COLOR]}`}>
                    <TrendIconComp size={13} />
                    <span>{item.trendLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Persona-Specific Insight Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          onContextMenu={e => { e.preventDefault(); setPanelMenu({ x: e.clientX, y: e.clientY, type: 'chartPanel' }); }}
          className="relative group lg:col-span-2 bg-[#F7F9FB] dark:bg-[#2C2C2C] rounded-3xl p-8 select-none"
        >
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">API Requests / min (Live)</h4>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest hidden sm:inline-block">Polling Data</span>
               </div>
               <button 
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPanel('chartPanel'); }}
                 className="opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg"
               >
                 <Pencil size={11} />
               </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <UniversalLineChart 
              data={apiRequestsData.data}
              xAxisKey="label"
              lines={[{ dataKey: 'value', strokeColor: '#10b981' }]}
            />
          </div>
        </div>

        <div
          onContextMenu={e => { e.preventDefault(); setPanelMenu({ x: e.clientX, y: e.clientY, type: 'statusPanel' }); }}
          className="relative group bg-[#F7F9FB] dark:bg-[#2C2C2C] rounded-3xl p-8 flex flex-col justify-between select-none"
        >
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{statusPanelTitle}</h4>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPanel('statusPanel'); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 -mr-2 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg -mt-1"
              >
                <Pencil size={11} />
              </button>
            </div>
            <p className="text-xs text-zinc-500 mb-6">Engine bound active metrics</p>
          </div>
          <div className="space-y-6 flex-1">
            {[{ stat: statusStat1, iconData: persona.stat1 }, { stat: statusStat2, iconData: persona.stat2 }].map(({ stat, iconData }, i) => {
              const StatIcon = iconData.icon;
              const valueMap: Record<number, number> = {
                0: stats?.totalBlockers ?? 0,
                1: stats?.escalatedBlockers ?? 0
              };
              const dynamicValue = valueMap[i] ?? 0;
              return (
                <div key={i} className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${iconData.iconBg} rounded-xl flex items-center justify-center ${iconData.iconColor}`}>
                    <StatIcon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">{dynamicValue} — {stat.label}</p>
                    <p className="text-[10px] text-zinc-500">{stat.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full py-3 mt-6 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity">
            {persona.actionButton}
          </button>
        </div>
      </div>

      <MetricBuilderModal 
        isOpen={isMetricBuilderOpen} 
        onClose={() => setIsMetricBuilderOpen(false)} 
        tenantId={tenantId}
        userId={currentUser?.id}
      />

      {panelMenu && (
        <ContextMenu
          x={panelMenu.x}
          y={panelMenu.y}
          onClose={() => setPanelMenu(null)}
          items={[{
            label: 'Edit Panel',
            icon: <Pencil size={12} />,
            onClick: () => setEditingPanel(panelMenu.type)
          }]}
        />
      )}

      {editingPanel && (
        <EditPanelModal
          panelType={editingPanel}
          tenantId={tenantId!}
          initialTitle={editingPanel === 'sidePanel' ? sidePanel.title : editingPanel === 'chartPanel' ? chartPanelLabel : editingPanel === 'velocityPanel' ? 'Task Completion Velocity' : statusPanelTitle}
          onClose={() => setEditingPanel(null)}
          {...(editingPanel === 'sidePanel' ? { initialItems: sidePanel.items } : {})}
          {...(editingPanel === 'chartPanel' ? { initialChartLabel: chartPanelLabel } : {})}
          {...(editingPanel === 'statusPanel' ? { initialStats: [statusStat1, statusStat2] } : {})}
        />
      )}
    </div>
  );
};
