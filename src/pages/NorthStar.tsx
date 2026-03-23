import React, { useEffect, useState } from 'react';
import { Target, Flag, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useNorthStarStore } from '../store/northStarStore';
import { UpdateNorthStarModal } from '../components/UpdateNorthStarModal';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';

export const NorthStar = () => {
  const { currentTenantId: tenantId } = useWorkspaceStore();
  const { objective, milestones, chartData, fetchNorthStar, toggleMilestone } = useNorthStarStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (tenantId) fetchNorthStar(tenantId);
  }, [tenantId, fetchNorthStar]);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><Target className="text-emerald-500" /> North Star</h2>
        <p className="text-zinc-500 text-sm mt-1">Your company's primary guiding metric and long-term vision.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Star size={120} />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-500 mb-2">Current North Star</h3>
            <p className="text-4xl font-bold text-white mb-4 z-10 relative">
              {objective.title}
            </p>
            <p className="text-zinc-400 max-w-md z-10 relative leading-relaxed">
              {objective.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-zinc-800 rounded-3xl p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <Flag size={20} />
              </div>
              <h4 className="font-bold text-white mb-4">Milestones</h4>
              <ul className="space-y-4 text-sm text-zinc-400">
                {milestones.map(m => (
                  <li 
                    key={m.id} 
                    className={`flex items-start gap-3 cursor-pointer group transition-all duration-300 ${m.isCompleted ? 'opacity-40' : 'opacity-100 hover:opacity-80'}`}
                    onClick={() => { if(tenantId) toggleMilestone(tenantId, m.id) }}
                  >
                    <div className="mt-0.5 shrink-0 transition-transform group-active:scale-90">
                      {m.isCompleted ? (
                        <CheckCircle2 size={16} className="text-zinc-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 group-hover:bg-emerald-500/20 transition-colors" />
                      )}
                    </div>
                    <span className={m.isCompleted ? 'line-through text-zinc-500 transition-all' : 'font-medium text-white transition-all'}>{m.label}</span>
                  </li>
                ))}
                {milestones.length === 0 && <li className="text-zinc-600 italic">No milestones defined.</li>}
              </ul>
            </div>
            
            <div className="bg-white/5 border border-zinc-800 rounded-3xl p-6 flex flex-col">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h4 className="font-bold text-white mb-4">Growth Trajectory</h4>
              <div className="flex-1 w-full min-h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 10}} dy={10} />
                    <YAxis hide />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white/5 border border-zinc-800 rounded-3xl p-6">
             <h3 className="text-sm font-bold text-white mb-4">Why it matters?</h3>
             <p className="text-xs text-zinc-500 leading-relaxed">
               Aligning your entire team around a single, unified metric ensures that every feature shipped, every marketing campaign launched, and every support ticket resolved contributes directly to the company's long-term success.
             </p>
             <button 
               onClick={() => setIsModalOpen(true)}
               className="w-full py-3 mt-6 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors border border-zinc-700 active:scale-95"
             >
               Update Framework
             </button>
           </div>
        </div>
      </div>

      <UpdateNorthStarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
