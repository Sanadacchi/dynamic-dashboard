import React from 'react';
import { TrendingUp } from 'lucide-react';

export const StatCard = ({ label, value, trend, color }: { label: string, value: string, trend: string, color: string }) => (
  <div className={`p-6 rounded-3xl bg-[#F7F9FB] dark:bg-[#2C2C2C] flex flex-col justify-between h-40`}>
    <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>
    <div className="flex items-center justify-between">
      <h3 className="text-3xl font-bold text-zinc-900 dark:text-white">{value}</h3>
      <div className="flex items-center gap-1 text-[10px] font-bold">
        <span>{trend}</span>
        <TrendingUp size={12} />
      </div>
    </div>
  </div>
);
