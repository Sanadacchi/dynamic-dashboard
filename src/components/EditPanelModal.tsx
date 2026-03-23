import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useLayoutStore } from '../store/layoutStore';
import { supabase } from '../lib/supabase';
import { PERSONA_DATA, PersonaType } from '../personaConfig';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type TrendType = 'up' | 'down' | 'neutral';

interface SideItem {
  label: string;
  value: string;
  trend: TrendType;
  trendLabel: string;
}

interface StatItem {
  label: string;
  value: string;
  sub: string;
}

interface EditPanelModalProps {
  panelType: 'sidePanel' | 'chartPanel' | 'statusPanel' | 'velocityPanel';
  tenantId: number;
  initialTitle: string;
  initialItems?: SideItem[];   // sidePanel — 3 items
  initialStats?: StatItem[];   // statusPanel — 2 stats
  initialChartLabel?: string;  // chartPanel
  onClose: () => void;
}

const TREND_OPTIONS: { value: TrendType; icon: React.ReactNode; label: string }[] = [
  { value: 'up', icon: <TrendingUp size={12} />, label: 'Up' },
  { value: 'neutral', icon: <Minus size={12} />, label: 'Flat' },
  { value: 'down', icon: <TrendingDown size={12} />, label: 'Down' },
];

export const EditPanelModal = ({
  panelType, tenantId, initialTitle, initialItems, initialStats, initialChartLabel, onClose
}: EditPanelModalProps) => {
  const queryClient = useQueryClient();

  const { taskVelocityData, setTaskVelocityData } = useWorkspaceStore();
  const [title, setTitle] = useState(initialTitle);
  const [chartLabel, setChartLabel] = useState(initialChartLabel ?? '');
  const [items, setItems] = useState<SideItem[]>(initialItems ?? []);
  const [stats, setStats] = useState<StatItem[]>(initialStats ?? []);
  const [localVelocityData, setLocalVelocityData] = useState(taskVelocityData);

  const updateVelocity = (i: number, field: 'current' | 'previous', val: string) => {
    setLocalVelocityData(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: Number(val) } : v));
  };

  const updateItem = (i: number, field: keyof SideItem, val: string) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const updateStat = (i: number, field: keyof StatItem, val: string) =>
    setStats(prev => prev.map((st, idx) => idx === i ? { ...st, [field]: val } : st));

  const save = useMutation({
    mutationFn: async () => {
      if (panelType === 'velocityPanel') {
        setTaskVelocityData(localVelocityData);
        return { success: true };
      }

      const payload: Record<string, any> = {};
      if (panelType === 'sidePanel')    payload.sidePanel    = { title, items };
      if (panelType === 'chartPanel')   payload.chartPanel   = { title: chartLabel };
      if (panelType === 'statusPanel')  payload.statusPanel  = { title, stats };

      const { data: tenant, error: fetchError } = await supabase
        .from('tenants')
        .select('custom_labels')
        .eq('id', tenantId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const existing = tenant?.custom_labels ? (typeof tenant.custom_labels === 'string' ? JSON.parse(tenant.custom_labels) : tenant.custom_labels) : {};
      const merged = { ...existing, ...payload };
      
      const { error: updateError } = await supabase
        .from('tenants')
        .update({ custom_labels: merged })
        .eq('id', tenantId);
        
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', tenantId] });
      onClose();
    }
  });

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-[#1C1C1C] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-white">
            {panelType === 'chartPanel' ? 'Edit Chart Panel' : panelType === 'statusPanel' ? 'Edit Status Panel' : panelType === 'velocityPanel' ? 'Edit Task Velocity Chart' : 'Edit Side Panel'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Chart panel: just the label */}
          {panelType === 'chartPanel' && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Chart Title</label>
              <input
                value={chartLabel}
                onChange={e => setChartLabel(e.target.value)}
                className="w-full bg-white/5 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors"
              />
            </div>
          )}

          {/* Side panel / status panel: title */}
          {(panelType === 'sidePanel' || panelType === 'statusPanel') && (
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Panel Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white/5 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors"
              />
            </div>
          )}

          {/* Side panel items */}
          {panelType === 'sidePanel' && items.map((item, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Item {i + 1}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Label</label>
                  <input value={item.label} onChange={e => updateItem(i, 'label', e.target.value)}
                    className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Value</label>
                  <input value={item.value} onChange={e => updateItem(i, 'value', e.target.value)}
                    className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Trend Note</label>
                  <input value={item.trendLabel} onChange={e => updateItem(i, 'trendLabel', e.target.value)}
                    className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Direction</label>
                  <div className="flex gap-1">
                    {TREND_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => updateItem(i, 'trend', opt.value)}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[10px] border transition-colors
                          ${item.trend === opt.value
                            ? opt.value === 'up' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                              : opt.value === 'down' ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                              : 'bg-zinc-600/30 border-zinc-600 text-zinc-400'
                            : 'border-zinc-700 bg-white/5 text-zinc-500 hover:border-zinc-600'}`}>
                        {opt.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Velocity panel items */}
          {panelType === 'velocityPanel' && localVelocityData.map((dataPt, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{dataPt.label} Metrics</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Current</label>
                  <input type="number" value={dataPt.current} onChange={e => updateVelocity(i, 'current', e.target.value)}
                    className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Previous</label>
                  <input type="number" value={dataPt.previous} onChange={e => updateVelocity(i, 'previous', e.target.value)}
                    className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
                </div>
              </div>
            </div>
          ))}

          {/* Status panel stats */}
          {panelType === 'statusPanel' && stats.map((stat, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stat {i + 1}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Label</label>
                  <input value={stat.label} onChange={e => updateStat(i, 'label', e.target.value)}
                    className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-600 mb-1">Value</label>
                  <input value={stat.value} onChange={e => updateStat(i, 'value', e.target.value)}
                    className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-zinc-600 mb-1">Sub-label</label>
                <input value={stat.sub} onChange={e => updateStat(i, 'sub', e.target.value)}
                  className="w-full bg-white/5 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-white/30" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={() => save.mutate()} disabled={save.isPending}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50">
            {save.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
