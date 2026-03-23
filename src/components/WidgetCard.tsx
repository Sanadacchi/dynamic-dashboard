import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Minus, Pencil, Trash2, Webhook, Copy, Check, X } from 'lucide-react';
import { CustomWidget } from '../types';
import { ContextMenu } from './ContextMenu';
import { EditWidgetModal } from './EditWidgetModal';

export const WidgetCard = ({ widget }: { key?: any; widget: CustomWidget }) => {
  const queryClient = useQueryClient();
  const config = widget.config ? JSON.parse(widget.config) : {};
  const isManual = config.dataSource === 'Manual Input';

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    const code = `fetch('http://localhost:3000/api/v1/ingest/${widget.id}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ value: ${widget.current_value + 1} })
})
.then(response => response.json())
.then(data => console.log(data));`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateValue = useMutation({
    mutationFn: (newValue: number) => fetch(`/api/custom-widgets/${widget.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentValue: newValue })
    }).then(res => res.json()),
    onMutate: async (newValue) => {
      await queryClient.cancelQueries({ queryKey: ['customWidgets', widget.tenant_id] });
      const previousWidgets = queryClient.getQueryData(['customWidgets', widget.tenant_id]);
      queryClient.setQueryData(['customWidgets', widget.tenant_id], (old: CustomWidget[] | undefined) =>
        old?.map(w => w.id === widget.id ? { ...w, current_value: newValue } : w)
      );
      return { previousWidgets };
    },
    onError: (err, newValue, context) => {
      if (context?.previousWidgets) {
        queryClient.setQueryData(['customWidgets', widget.tenant_id], context.previousWidgets);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customWidgets', widget.tenant_id] });
    }
  });

  const deleteWidget = useMutation({
    mutationFn: () => fetch(`/api/custom-widgets/${widget.id}`, { method: 'DELETE' }).then(res => res.json()),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['customWidgets', widget.tenant_id] });
      const prev = queryClient.getQueryData(['customWidgets', widget.tenant_id]);
      queryClient.setQueryData(['customWidgets', widget.tenant_id], (old: CustomWidget[] | undefined) =>
        old?.filter(w => w.id !== widget.id)
      );
      return { prev };
    },
    onError: (err, _, context) => {
      if (context?.prev) queryClient.setQueryData(['customWidgets', widget.tenant_id], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['customWidgets', widget.tenant_id] });
    }
  });

  const handleIncrement = () => updateValue.mutate(widget.current_value + 1);
  const handleDecrement = () => updateValue.mutate(Math.max(0, widget.current_value - 1));

  const accentColor = config.color || 'indigo';
  // If no goal is set, treat current_value as a percentage directly (out of 100)
  const effectiveGoal = widget.goal_value || 100;
  const progressPercent = widget.type === 'Progress Bar'
    ? Math.min(100, Math.round((widget.current_value / effectiveGoal) * 100))
    : 0;

  const displayValue = widget.type === 'Percentage'
    ? `${widget.current_value}%`
    : widget.type === 'Progress Bar'
      ? `${progressPercent}%`
      : widget.current_value;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        className="relative group overflow-hidden rounded-3xl bg-[#F7F9FB] dark:bg-[#2C2C2C] min-h-[160px] flex flex-col items-center justify-center p-6 text-center gap-3 cursor-default select-none"
      >
        {/* Colored dot / accent */}
        <div className={`w-10 h-10 rounded-full bg-${accentColor}-500/15 flex items-center justify-center`}>
          <div className={`w-3 h-3 rounded-full bg-${accentColor}-500`} />
        </div>

        {/* Label */}
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-tight px-2">
          {widget.label}
        </p>

        {/* Big value */}
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-bold text-zinc-900 dark:text-white leading-none">
            {displayValue}
          </h3>
          {widget.goal_value && widget.type !== 'Progress Bar' && widget.type !== 'Percentage' && (
            <span className="text-sm text-zinc-500 font-medium">/ {widget.goal_value}</span>
          )}
          {widget.type === 'Progress Bar' && widget.goal_value && (
            <span className="text-sm text-zinc-500 font-medium">({widget.current_value}/{widget.goal_value})</span>
          )}
        </div>

        {/* Progress bar — always shown for Progress Bar type */}
        {widget.type === 'Progress Bar' && (
          <div className="w-full space-y-1">
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 bg-${accentColor}-500`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {!widget.goal_value && (
              <p className="text-[9px] text-zinc-500 text-center">Set a goal value to track progress</p>
            )}
          </div>
        )}

        {/* Type badge */}
        <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-600">
          {widget.type}
        </span>

        {/* Right-click hint on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600">
          <Pencil size={11} />
        </div>

        {/* Manual +/- controls */}
        {isManual && (
          <div className="absolute top-0 right-0 bottom-0 flex flex-col justify-center border-l border-zinc-800/50 bg-[#2C2C2C]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 translate-x-full group-hover:translate-x-0 transition-all duration-200 z-20">
            <button onClick={handleIncrement} className="p-3 hover:bg-white/10 text-emerald-500 transition-colors">
              <Plus size={16} />
            </button>
            <div className="h-px w-full bg-zinc-800/50" />
            <button onClick={handleDecrement} className="p-3 hover:bg-white/10 text-rose-500 transition-colors">
              <Minus size={16} />
            </button>
          </div>
        )}

        {/* Subtle glow */}
        <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none bg-${accentColor}-500`} />
      </div>

      {/* Context menu */}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            {
              label: 'Webhook Snippet',
              icon: <Webhook size={12} />,
              onClick: () => setShowWebhook(true)
            },
            {
              label: 'Edit Metric',
              icon: <Pencil size={12} />,
              onClick: () => setEditing(true)
            },
            {
              label: 'Delete Metric',
              icon: <Trash2 size={12} />,
              onClick: () => deleteWidget.mutate(),
              danger: true
            }
          ]}
        />
      )}

      {/* Webhook Snippet Modal */}
      {showWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWebhook(false)} />
          <div className="relative bg-[#1C1C1C] border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Webhook className="text-indigo-500" />
                Ingestion Webhook URL
              </h3>
              <button onClick={() => setShowWebhook(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Connect external apps like Stripe, Shopify, or custom apps directly into this precise metric widget in real-time. Do not forget to attach your generated <strong>API Key</strong> in the Bearer authorization header.
            </p>

            <div className="p-4 bg-black/50 border border-zinc-800 rounded-xl overflow-x-auto relative mb-4">
              <button 
                onClick={handleCopyCode}
                className="absolute top-4 right-4 text-xs font-bold text-zinc-500 hover:text-white flex items-center gap-1.5 transition-colors bg-black/80 px-2 py-1 rounded"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />} {copied ? 'Copied' : 'Copy'}
              </button>
              <pre>
                <code className="text-xs font-mono text-zinc-300">
<span className="text-indigo-400">fetch</span>(<span className="text-emerald-300">'http://localhost:3000/api/v1/ingest/{widget.id}'</span>, {'{'}
  <span className="text-indigo-400">method</span>: <span className="text-emerald-300">'POST'</span>,
  <span className="text-indigo-400">headers</span>: {'{'}
    <span className="text-emerald-300">'Authorization'</span>: <span className="text-emerald-300">'Bearer YOUR_API_KEY'</span>,
    <span className="text-emerald-300">'Content-Type'</span>: <span className="text-emerald-300">'application/json'</span>
  {'}'},
  <span className="text-indigo-400">body</span>: <span className="text-orange-300">JSON</span>.<span className="text-indigo-400">stringify</span>({'{'} <span className="text-indigo-400">value</span>: <span className="text-orange-400">{widget.current_value + (widget.type === 'Percentage' ? 5 : 1)}</span> {'}'})
{'}'})
.<span className="text-indigo-400">then</span>(response =&gt; response.<span className="text-indigo-400">json</span>())
.<span className="text-indigo-400">then</span>(data =&gt; console.<span className="text-indigo-400">log</span>(data));
                </code>
              </pre>
            </div>
            
            <p className="text-xs text-zinc-500 text-center">Copy this Javascript boilerplate directly into your external code layer.</p>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditWidgetModal widget={widget} onClose={() => setEditing(false)} />
      )}
    </>
  );
};
