import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, RotateCcw } from 'lucide-react';

export const CountdownTimer = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const h = Math.floor(time / 3600).toString().padStart(2, '0');
  const m = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
  const s = (time % 60).toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200 dark:border-zinc-800 group relative">
      <button onClick={() => setIsRunning(!isRunning)} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Clock size={14} className={isRunning ? "text-pink-500 animate-pulse" : "text-zinc-500"} />
        <span className="text-xs font-mono text-zinc-900 dark:text-white">{h}:{m}:{s}</span>
      </button>
      
      {/* Hover Dropdown for Reset */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none group-hover:pointer-events-auto shadow-xl z-50">
        <button onClick={() => setIsRunning(!isRunning)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded text-zinc-900 dark:text-white" title={isRunning ? "Pause" : "Start"}>
          {isRunning ? <Square size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => { setTime(0); setIsRunning(false); }} className="p-1.5 hover:bg-rose-500/20 text-rose-500 rounded" title="Reset">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
};
