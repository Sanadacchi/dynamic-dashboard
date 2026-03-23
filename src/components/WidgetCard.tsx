import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Plus, Minus, Pencil, Trash2, Webhook, Copy, Check, X, Activity, Target } from 'lucide-react';
import { CustomWidget } from '../types';
import { ContextMenu } from './ContextMenu';
import { EditWidgetModal } from './EditWidgetModal';

interface WidgetCardProps {
  widget: CustomWidget;
}

export const WidgetCard = ({ widget }: WidgetCardProps) => {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [showWebhookSnippet, setShowWebhookSnippet] = useState(false);
  const [copied, setCopied] = useState(false);

  const config = widget.config ? (typeof widget.config === 'string' ? JSON.parse(widget.config) : widget.config) : {};
  const accentColor = config.color || 'blue';
  const progressPercent = Math.min(Math.round((widget.current_value / (widget.goal_value || 100)) * 100), 100);
  const isManual = config.dataSource === 'Manual Input' || !config.dataSource;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const updateValue = useMutation({
    mutationFn: async (newValue: number) => {
      const { error } = await supabase
        .from('custom_widgets')
        .update({ current_value: newValue })
        .eq('id', widget.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-widgets'] });
    }
  });

  const deleteWidget = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('custom_widgets').delete().eq('id', widget.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-widgets'] });
    }
  });

  const handleCopySnippet = () => {
    const snippet = `fetch('https://your-api.com/webhooks/widget/${widget.id}', {
  method: 'POST',
  body: JSON.stringify({ value: 10 })
})`;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onContextMenu={handleContextMenu}
      className="group relative bg-[#1C1C1C] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 md:p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${accentColor}-500/10 flex items-center justify-center text-${accentColor}-500`}>
            {widget.type === 'counter' ? <Activity size={20} /> : <Target size={20} />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{widget.label}</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Custom Metric</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {widget.current_value.toLocaleString()}
          </span>
          <span className="text-zinc-500 text-xs font-medium ml-1.5">/ {widget.goal_value?.toLocaleString()}</span>
        </div>
        <div className={`px-2 py-1 rounded-lg bg-${accentColor}-500/10 text-${accentColor}-500 text-[10px] font-bold`}>
          {progressPercent}%
        </div>
      </div>

      <div className="relative h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full bg-${accentColor}-500 transition-all duration-500 ease-out`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {isManual && (
        <div className="mt-6 flex items-center gap-3">
          <button 
            onClick={() => updateValue.mutate(widget.current_value - 1)}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors flex items-center justify-center"
          >
            <Minus size={16} />
          </button>
          <button 
            onClick={() => updateValue.mutate(widget.current_value + 1)}
            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition-colors flex items-center justify-center"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {menuPosition && (
        <ContextMenu 
          x={menuPosition.x}
          y={menuPosition.y}
          onClose={() => setMenuPosition(null)}
          items={[
            { 
              label: 'Edit Metric', 
              icon: <Pencil size={14} />, 
              onClick: () => setIsEditModalOpen(true) 
            },
            { 
              label: 'Webhook Snippet', 
              icon: <Webhook size={14} />, 
              onClick: () => setShowWebhookSnippet(true) 
            },
            { 
              label: 'Delete Metric', 
              icon: <Trash2 size={14} />, 
              onClick: () => { if(confirm('Delete this metric?')) deleteWidget.mutate(); },
              danger: true
            }
          ]}
        />
      )}

      {showWebhookSnippet && (
        <div className="absolute bottom-0 left-0 w-full p-4 bg-zinc-900 border-t border-zinc-800 rounded-b-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Webhook Integration</span>
            <button onClick={() => setShowWebhookSnippet(false)} className="text-zinc-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="relative group/code">
            <pre className="text-[10px] font-mono text-indigo-300 bg-black/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {`fetch('https://your-api.com/webhooks/widget/${widget.id}', {\n  method: 'POST',\n  body: JSON.stringify({ value: 10 })\n})`}
            </pre>
            <button 
              onClick={handleCopySnippet}
              className="absolute top-2 right-2 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-md opacity-0 group-hover/code:opacity-100 transition-opacity"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditWidgetModal 
          widget={widget} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </div>
  );
};
