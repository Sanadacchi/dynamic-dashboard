import React from 'react';
import { UserCircle, AlertCircle, CheckCircle2, MessageSquare, Plus, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { useProjectStore } from '../store/projectStore';
import { formatDistanceToNow } from 'date-fns';

export const RightSidebar = ({ users }: { users: User[] }) => {
  const { tasks } = useProjectStore();

  // Combine and sort activities from all tasks
  const activities = tasks
    .flatMap(t => (t.activity || []).map(a => ({ ...a, taskTitle: t.title })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return (
    <aside className="w-72 border-l border-zinc-800 h-screen sticky top-0 bg-[#1C1C1C] p-6 flex flex-col gap-8 overflow-y-auto">
      <div>
        <h4 className="text-sm font-bold text-white mb-4">Notifications</h4>
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-zinc-800 rounded-xl bg-white/5">
            <p className="text-xs text-zinc-500">No new notifications</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white mb-4">Recent Activity</h4>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-zinc-800 rounded-xl bg-white/5">
              <p className="text-xs text-zinc-500">No recent activity</p>
            </div>
          ) : (
            activities.map((a, i) => (
              <div key={a.id || i} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 ${
                  a.text.includes('moved') ? 'text-blue-500' :
                  a.text.includes('created') ? 'text-emerald-500' : 'text-zinc-500'
                }`}>
                  {a.text.includes('moved') ? <ArrowRight size={14} /> :
                   a.text.includes('created') ? <Plus size={14} /> : <MessageSquare size={14} />}
                </div>
                <div>
                  <p className="text-[11px] text-white font-medium leading-tight">
                    {a.text} <span className="text-zinc-500">on</span> {a.taskTitle}
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">
                    {formatDistanceToNow(new Date(a.timestamp))} ago
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white mb-4">War Room Contacts</h4>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">
                  {user.name.charAt(0)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1C1C1C] ${
                  user.status === 'Online' ? 'bg-emerald-500' : 
                  user.status === 'Focus' ? 'bg-amber-500' : 'bg-zinc-600'
                }`} />
              </div>
              <span className="text-xs text-white font-medium">{user.name}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
