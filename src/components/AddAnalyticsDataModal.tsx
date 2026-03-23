import React, { useState } from 'react';
import { X, Plus, Calendar, User, Activity, DollarSign, Bug } from 'lucide-react';

export const AddAnalyticsDataModal = ({ isOpen, onClose, onSave, users }: any) => {
  if (!isOpen) return null;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // format: yyyy-mm-dd
  const [user, setUser] = useState(users?.[0]?.name || 'System');
  const [velocity, setVelocity] = useState<number | string>(0);
  const [revenue, setRevenue] = useState<number | string>(0);
  const [bugs, setBugs] = useState<number | string>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      date,
      user,
      velocity: Number(velocity),
      revenue: Number(revenue),
      bugs: Number(bugs),
    });
    onClose();
    // Reset form for next entry
    setVelocity(0);
    setRevenue(0);
    setBugs(0);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1C1C1C] border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl relative">
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Add Data Point</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 text-center">
            Fill in the details below to manually record a new analytics data point for your charts.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Calendar size={14}/> Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><User size={14}/> User / Segment</label>
            <select value={user} onChange={e => setUser(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors">
              {users?.map((u: any) => <option key={u.id} value={u.name}>{u.name}</option>)}
              {(!users || users.length === 0) && <option value="System">System</option>}
              <option value="Robot Delta">Robot Delta</option>
              <option value="Server API">Server API</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Activity size={14}/> Velocity</label>
              <input type="number" required value={velocity} onChange={e => setVelocity(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. 42" />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><DollarSign size={14}/> Revenue ($)</label>
              <input type="number" required value={revenue} onChange={e => setRevenue(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. 500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Bug size={14}/> Bugs Fixed</label>
            <input type="number" required value={bugs} onChange={e => setBugs(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. 3" />
          </div>

          <div className="pt-4 mt-6 border-t border-zinc-200 dark:border-zinc-800 justify-end flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"><Plus size={18}/> Save Data</button>
          </div>
        </form>
      </div>
    </div>
  );
};
