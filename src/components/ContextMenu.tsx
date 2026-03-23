import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Keep menu within viewport
  const adjustedX = Math.min(x, window.innerWidth - 180);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40 - 16);

  return ReactDOM.createPortal(
    <div
      ref={ref}
      style={{ top: adjustedY, left: adjustedX }}
      className="fixed z-[9999] bg-[#1a1a1a] border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/50 py-1.5 min-w-[160px] backdrop-blur-md"
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.onClick(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors text-left
            ${item.danger
              ? 'text-rose-400 hover:bg-rose-500/10'
              : 'text-zinc-300 hover:bg-white/8 hover:text-white'
            }`}
        >
          {item.icon && <span className="opacity-70">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>,
    document.body
  );
};
