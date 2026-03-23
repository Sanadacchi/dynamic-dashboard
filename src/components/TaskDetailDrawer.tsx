import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Clock, Flag, User, Send, Trash2 } from 'lucide-react';
import { Task, useProjectStore } from '../store/projectStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { format } from 'date-fns';

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-zinc-500/20 text-zinc-400',
  Medium: 'bg-blue-500/15 text-blue-400',
  High: 'bg-amber-500/15 text-amber-400',
  Critical: 'bg-rose-500/15 text-rose-500',
};

interface TaskDetailDrawerProps {
  task: Task | null;
  vocab: { taskLabel: string };
  onClose: () => void;
}

export const TaskDetailDrawer = ({ task, vocab, onClose }: TaskDetailDrawerProps) => {
  const { currentUser } = useWorkspaceStore();
  const { addComment, deleteTask } = useProjectStore();
  const [commentText, setCommentText] = useState('');

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentText.trim()) return;
    addComment(task.id, currentUser?.id ?? 0, currentUser?.name ?? 'You', commentText.trim());
    setCommentText('');
  };

  const handleDelete = () => {
    if (!task) return;
    if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200]"
          />
          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-[#1C1C1C] border-l border-zinc-200 dark:border-zinc-800 z-[201] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{vocab.taskLabel}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDelete} className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
                <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Task Info */}
              <div className="p-6 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug">{task.title}</h2>
                {task.description && (
                  <p className="text-sm text-zinc-500 leading-relaxed">{task.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
                  {task.assigneeName && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                        {task.assigneeName.charAt(0)}
                      </div>
                      {task.assigneeName}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} /> Created {format(new Date(task.createdAt), 'MMM d')}
                  </div>
                  <div className="flex items-center gap-1.5 capitalize">
                    <Flag size={12} /> {task.status.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="p-6 space-y-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare size={13} /> Comments ({task.comments.length})
                </h3>
                {task.comments.length === 0 && (
                  <p className="text-sm text-zinc-500 italic">No comments yet. Be the first to chime in.</p>
                )}
                {task.comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {c.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 bg-zinc-50 dark:bg-white/5 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">{c.authorName}</span>
                        <span className="text-[10px] text-zinc-500">{format(new Date(c.timestamp), 'MMM d, HH:mm')}</span>
                      </div>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{c.text}</p>
                    </div>
                  </div>
                ))}

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl disabled:opacity-40 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

              {/* Activity Log */}
              <div className="p-6 space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={13} /> Activity Log
                </h3>
                {task.activity.map(a => (
                  <div key={a.id} className="flex items-start gap-3 text-xs text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-1.5 shrink-0" />
                    <div>
                      <span>{a.text}</span>
                      <span className="ml-2 text-zinc-400">{format(new Date(a.timestamp), 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
