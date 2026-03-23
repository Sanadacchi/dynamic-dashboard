import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Plus, BarChart3, Activity, Target } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const MetricBuilderModal = ({ 
  isOpen, 
  onClose, 
  tenantId, 
  userId 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  tenantId: number; 
  userId: number; 
}) => {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [type, setType] = useState("Simple Counter");
  const [dataSource, setDataSource] = useState("Manual Input");
  const [goal, setGoal] = useState("");
  const [color, setColor] = useState("blue");

  const createWidget = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('custom_widgets')
        .insert([{
          tenant_id: data.tenantId,
          user_id: data.userId,
          label: data.label,
          type: data.type,
          goal_value: data.goalValue,
          config: data.config
        }]);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customWidgets', tenantId] });
      onClose();
      // Reset form
      setLabel("");
      setType("Simple Counter");
      setDataSource("Manual Input");
      setGoal("");
      setColor("blue");
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label) return;

    createWidget.mutate({
      tenantId,
      userId,
      label,
      type,
      goalValue: goal ? parseFloat(goal) : null,
      config: { color, dataSource }
    });
  };

  const colors = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'emerald', class: 'bg-emerald-500' },
    { name: 'indigo', class: 'bg-indigo-500' },
    { name: 'rose', class: 'bg-rose-500' },
    { name: 'amber', class: 'bg-amber-500' },
    { name: 'purple', class: 'bg-purple-500' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1C1C1C] border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target size={20} className="text-emerald-500" />
            Add to Dashboard
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Display Name</label>
            <input 
              type="text" 
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g., Active Fans, Daily Revenue" 
              className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition-colors"
              required
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Metric Type</label>
             <div className="grid grid-cols-2 gap-3">
               {['Simple Counter', 'Percentage', 'Trend Line', 'Progress Bar'].map(t => (
                 <div 
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-3 rounded-xl border text-sm cursor-pointer transition-colors flex items-center gap-2 ${type === t ? 'border-primary bg-white/10 text-white' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                 >
                   {t === 'Simple Counter' && <Target size={14} />}
                   {t === 'Percentage' && <Activity size={14} />}
                   {t === 'Trend Line' && <BarChart3 size={14} />}
                   {t === 'Progress Bar' && <div className="w-3 h-3 rounded-full border-2 border-current" />}
                   {t}
                 </div>
               ))}
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Data Source</label>
            <select 
              value={dataSource}
              onChange={e => setDataSource(e.target.value)}
              className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition-colors [&>option]:text-black"
            >
              <option value="Manual Input">Manual Input</option>
              <option value="Connected API">Connected API</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Target Goal (Optional)</label>
            <input 
              type="number" 
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g., Aiming for 50 per day" 
              className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Color Theme</label>
            <div className="flex gap-3">
              {colors.map(c => (
                <div 
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all ${c.class} ${color === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1C1C1C] scale-110' : 'opacity-50 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button 
              type="submit"
              disabled={!label || createWidget.isPending}
              className="w-full bg-white text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              {createWidget.isPending ? 'Adding to Dashboard...' : 'Add to Dashboard'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
