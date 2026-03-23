import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useNorthStarStore, Milestone } from '../store/northStarStore';
import { useNotificationStore } from '../store/notificationStore';
import { useWorkspaceStore } from '../store/workspaceStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UpdateNorthStarModal = ({ isOpen, onClose }: Props) => {
  const { currentTenantId } = useWorkspaceStore();
  const { objective, milestones, updateObjective } = useNorthStarStore();
  const { addNotification } = useNotificationStore();
  
  const [title, setTitle] = useState(objective.title);
  const [description, setDescription] = useState(objective.description);
  const [localMilestones, setLocalMilestones] = useState<Milestone[]>(milestones);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(objective.title);
      setDescription(objective.description);
      setLocalMilestones(milestones);
    }
  }, [isOpen, objective, milestones]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    setLocalMilestones([...localMilestones, { id: Math.random().toString(36).substring(7), label: '', isCompleted: false }]);
  };

  const handleUpdateMilestone = (id: string, label: string) => {
    setLocalMilestones(localMilestones.map(m => m.id === id ? { ...m, label } : m));
  };

  const handleRemoveMilestone = (id: string) => {
    setLocalMilestones(localMilestones.filter(m => m.id !== id));
  };

  const handleSave = async () => {
    if (!currentTenantId) return;
    setIsSubmitting(true);
    await updateObjective(currentTenantId, { title, description, milestones: localMilestones.filter(m => m.label.trim() !== '') });
    setIsSubmitting(false);
    addNotification('SUCCESS', 'North Star framework updated successfully.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1C1C1C] border border-zinc-800 rounded-3xl w-full max-w-xl flex flex-col max-h-[90vh] shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Update Framework</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Main Objective</label>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g. Launch MVP to 100 users"
              className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
            />
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Why does this matter?"
              className="w-full bg-white/5 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 min-h-[100px] resize-none transition-colors"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Milestones</label>
              <button onClick={handleAddMilestone} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 transition-colors">
                <Plus size={14} /> Add Step
              </button>
            </div>
            <div className="space-y-2">
              {localMilestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <input 
                    value={m.label}
                    onChange={e => handleUpdateMilestone(m.id, e.target.value)}
                    placeholder="Milestone description..."
                    className="flex-1 bg-white/5 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button onClick={() => handleRemoveMilestone(m.id)} className="p-2 text-zinc-600 hover:text-rose-500 transition-colors bg-white/5 rounded-lg border border-zinc-800">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {localMilestones.length === 0 && <p className="text-xs text-zinc-600 italic">No milestones set.</p>}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSubmitting || !title.trim()} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
            {isSubmitting ? 'Saving...' : 'Save Framework'}
          </button>
        </div>
      </div>
    </div>
  );
};
