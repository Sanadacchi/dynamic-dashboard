import React from 'react';
import { UserCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

export const RightSidebar = ({ users }: { users: User[] }) => (
  <aside className="w-72 border-l border-zinc-800 h-screen sticky top-0 bg-[#1C1C1C] p-6 flex flex-col gap-8 overflow-y-auto">
    <div>
      <h4 className="text-sm font-bold text-white mb-4">Notifications</h4>
      <div className="space-y-4">
        {[
          { icon: CheckCircle2, text: "You fixed a bug.", time: "Just now", color: "text-emerald-500" },
          { icon: UserCircle, text: "New user registered.", time: "59 mins ago", color: "text-blue-500" },
          { icon: AlertCircle, text: "Critical blocker active.", time: "12 hours ago", color: "text-rose-500" }
        ].map((n, i) => (
          <div key={i} className="flex gap-3">
            <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 ${n.color}`}>
              <n.icon size={14} />
            </div>
            <div>
              <p className="text-xs text-white font-medium">{n.text}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h4 className="text-sm font-bold text-white mb-4">Activities</h4>
      <div className="space-y-4">
        {[
          { user: "Alex", action: "Changed the style.", time: "Just now" },
          { user: "Sarah", action: "Released a new version.", time: "59 mins ago" },
          { user: "John", action: "Submitted a bug.", time: "12 hours ago" }
        ].map((a, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {a.user.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-white font-medium">{a.user} {a.action}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{a.time}</p>
            </div>
          </div>
        ))}
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
