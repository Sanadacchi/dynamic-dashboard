import React, { useState } from 'react';
import { Search, Sun, Moon, History, Bell, Sidebar as SidebarIcon, Menu, X, FileText, TrendingUp, Users, MessageSquare, Briefcase } from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';
import { CountdownTimer } from './CountdownTimer';
import { useNotificationStore } from '../store/notificationStore';
import { useLayoutStore } from '../store/layoutStore';

export const TopNavbar = ({ onOpenNotificationCenter }: { onOpenNotificationCenter: () => void }) => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notifications } = useNotificationStore();
  const { isLeftSidebarOpen, setLeftSidebarOpen, theme, setTheme } = useLayoutStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className={`h-14 md:h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 md:px-8 pl-4 sticky top-0 transition-all ${mobileMenuOpen ? 'z-[100] bg-white dark:bg-[#1C1C1C]' : 'z-10 bg-white/90 dark:bg-[#1C1C1C]/90 backdrop-blur-md'}`}>
      
      {/* Mobile iOS Template Header */}
      <div className="flex md:hidden items-center justify-between w-full">
        <div className="flex items-center gap-1 text-blue-500 font-medium text-[15px] cursor-pointer" onClick={() => window.history.back()}>
          <span className="text-xl leading-none mb-0.5 opacity-80">‹</span> Back
        </div>
        <div className="font-bold text-[15px] absolute left-1/2 -translate-x-1/2 text-zinc-900 dark:text-white tracking-wide">
          Grahamly
        </div>
        <div className="w-16 flex justify-end">
          <Menu size={22} className="text-zinc-400 cursor-pointer" onClick={() => setMobileMenuOpen(true)} />
        </div>
      </div>

      {/* Mobile Dropdown Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white dark:bg-[#1C1C1C] flex flex-col pt-32 px-8 overflow-y-auto">
          <button onClick={() => setMobileMenuOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-2">
            <X size={28} />
          </button>
          
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6 text-center">Navigation</h2>
          
          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto pb-10">
            <NavLink to={`/space/${tenantId}/projects`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <Briefcase className="text-yellow-500" /> Projects
            </NavLink>
            <NavLink to={`/space/${tenantId}/analytics`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <TrendingUp className="text-indigo-500" /> Analytics
            </NavLink>
            <NavLink to={`/space/${tenantId}/documents`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <FileText className="text-blue-500" /> Documents
            </NavLink>
            <NavLink to={`/space/${tenantId}/war-room`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <Users className="text-emerald-500" /> War Room
            </NavLink>
            <NavLink to={`/space/${tenantId}/social`} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-4 text-lg font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
              <MessageSquare className="text-pink-500" /> Social
            </NavLink>

            {/* Theme Toggle for Mobile */}
            <button 
              onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setMobileMenuOpen(false); }}
              className="flex items-center justify-between w-full mt-4 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-white/5"
            >
              <div className="flex items-center gap-4 text-lg font-medium text-zinc-900 dark:text-zinc-400">
                {theme === 'dark' ? <Moon className="text-amber-400" /> : <Sun className="text-amber-500" />}
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl">
        <button onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)} className={`text-zinc-500 hover:text-white transition-all ${!isLeftSidebarOpen && 'opacity-50'}`}>
          <SidebarIcon size={18} />
        </button>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full bg-zinc-100/50 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-10 pr-4 py-1.5 text-sm outline-none focus:border-indigo-500/50 transition-colors text-zinc-900 dark:text-white placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <CountdownTimer />
        <div className="flex items-center gap-4 text-zinc-500">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hover:text-amber-400 transition-colors">
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <div className="relative group cursor-pointer hover:text-zinc-900 dark:hover:text-white">
            <History size={18} />
            <div className="absolute top-full right-0 mt-4 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto shadow-xl z-50">
              <p className="text-xs font-bold text-zinc-500 mb-2 px-2 pt-1 border-b border-zinc-800 pb-2">Recent History</p>
              <div className="space-y-1 mt-1">
                {['Q3 Planning', 'API Engine', 'Design System', 'User Metrics', 'Marketing Site'].map((item, i) => (
                  <div key={i} className="px-2 py-1.5 hover:bg-white/5 rounded-lg text-sm text-zinc-300 transition-colors">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative cursor-pointer hover:text-white" onClick={onOpenNotificationCenter}>
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};
