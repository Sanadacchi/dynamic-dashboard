import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Hash, Percent, BarChart2, ChevronDown } from 'lucide-react';
import { CustomWidget } from '../types';

interface EditWidgetModalProps {
  widget: CustomWidget;
  onClose: () => void;
}

const WIDGET_TYPES = [
  {
    value: 'Simple Counter',
    label: 'Simple Counter',
    description: 'A plain number that counts up or down.',
    icon: Hash,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/40',
  },
  {
    value: 'Percentage',
    label: 'Percentage',
    description: 'Shows a value with a % sign.',
    icon: Percent,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
  },
  {
    value: 'Progress Bar',
    label: 'Progress Bar',
    description: 'Tracks progress toward a goal value.',
    icon: BarChart2,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
  },
];

export const EditWidgetModal = ({ widget, onClose }: EditWidgetModalProps) => {
  const queryClient = useQueryClient();

  const [label, setLabel] = useState(widget.label);
  const [type, setType] = useState(widget.type);
  const [currentValue, setCurrentValue] = useState(widget.current_value);
  const [goalValue, setGoalValue] = useState<number | ''>(widget.goal_value ?? '');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const selectedType = WIDGET_TYPES.find(t => t.value === type) || WIDGET_TYPES[0];

  const save = useMutation({
    mutationFn: () => fetch(`/api/custom-widgets/${widget.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label,
        type,
        currentValue: Number(currentValue),
        goalValue: goalValue !== '' ? Number(goalValue) : null
      })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customWidgets', widget.tenant_id] });
      onClose();
    }
  });

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-[#1C1C1C] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Edit Metric</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Label</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
              placeholder="Metric name..."
            />
          </div>

          {/* Type – custom dropdown */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Type</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setTypeDropdownOpen(o => !o)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors text-sm font-medium ${selectedType.bg} ${selectedType.border} border`}
              >
                <div className="flex items-center gap-2.5">
                  <selectedType.icon size={15} className={selectedType.color} />
                  <span className="text-zinc-900 dark:text-white">{selectedType.label}</span>
                  <span className="text-zinc-500 text-xs hidden sm:inline">— {selectedType.description}</span>
                </div>
                <ChevronDown size={14} className={`text-zinc-500 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {typeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  {WIDGET_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setType(t.value); setTypeDropdownOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-left ${type === t.value ? 'bg-zinc-50 dark:bg-white/5' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.bg}`}>
                        <t.icon size={15} className={t.color} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{t.label}</p>
                        <p className="text-xs text-zinc-500">{t.description}</p>
                      </div>
                      {type === t.value && (
                        <div className={`ml-auto w-2 h-2 rounded-full ${t.color.replace('text-', 'bg-')}`} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Current Value */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Current Value</label>
            <input
              type="number"
              value={currentValue}
              onChange={e => setCurrentValue(Number(e.target.value))}
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Goal Value */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Goal Value <span className="text-zinc-400 normal-case">(optional — used by Progress Bar)</span>
            </label>
            <input
              type="number"
              value={goalValue}
              onChange={e => setGoalValue(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Leave blank if not needed"
              className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {save.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
