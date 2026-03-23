import React, { useState } from 'react';
import { X, Flag, User, AlignLeft } from 'lucide-react';
import { Priority } from '../store/projectStore';

interface AddProjectModalProps {
  vocab: { projectLabel: string; taskLabel: string };
  users: any[];
  tenantId: number;
  onSave: (data: { title: string; description: string; color: string }) => void;
  onClose: () => void;
}

const COLORS = ['indigo', 'emerald', 'amber', 'rose', 'purple', 'sky', 'orange'];

export const AddProjectModal = ({ vocab, users, tenantId, onSave, onClose }: AddProjectModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title, description, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1C1C1C] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">New {vocab.projectLabel}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`e.g. ${vocab.projectLabel} Alpha`}
              required
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><AlignLeft size={13} /> Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this about?"
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full bg-${c}-500 transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 ring-${c}-500' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">Create {vocab.projectLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------

interface AddTaskModalProps {
  projectId: string;
  vocab: { taskLabel: string };
  users: any[];
  onSave: (data: { title: string; description: string; assigneeId: number | null; assigneeName: string | null; priority: Priority }) => void;
  onClose: () => void;
}

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const PRIORITY_COLORS: Record<Priority, string> = {
  Low: 'text-zinc-400',
  Medium: 'text-blue-400',
  High: 'text-amber-400',
  Critical: 'text-rose-500',
};

export const AddTaskModal = ({ projectId, vocab, users, onSave, onClose }: AddTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<number | null>(null);
  const [priority, setPriority] = useState<Priority>('Medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const assignee = users.find(u => u.id === assigneeId);
    onSave({ title, description, assigneeId, assigneeName: assignee?.name || null, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#1C1C1C] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Add {vocab.taskLabel}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Title</label>
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)} required placeholder="What needs to be done?" className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><AlignLeft size={13} /> Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Optional details..." className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 resize-none transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><User size={13} /> Assignee</label>
              <select value={assigneeId ?? ''} onChange={e => setAssigneeId(e.target.value ? Number(e.target.value) : null)} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 transition-colors">
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2"><Flag size={13} /> Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)} className={`w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 transition-colors font-bold ${PRIORITY_COLORS[priority]}`}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/20">Add {vocab.taskLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
