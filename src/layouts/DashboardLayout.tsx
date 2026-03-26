import React, { useState } from 'react';
import { Outlet, useParams, NavLink, useLocation } from 'react-router-dom';
import { Target, Bell, Settings, UserCircle, LayoutDashboard, Briefcase } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { TopNavbar } from '../components/TopNavbar';
import { RightSidebar } from '../components/RightSidebar';
import { NotificationCenter } from '../components/NotificationCenter';
import { useWorkspaceStore } from '../store/workspaceStore';
import { supabase } from '../lib/supabase';
import { useLayoutStore } from '../store/layoutStore';
import { useQuery } from '@tanstack/react-query';

export const DashboardLayout = () => {
  const { tenantId: urlTenantId } = useParams<{ tenantId: string }>();
  const location = useLocation();
  const { currentTenantId: tenantId, setTenantId } = useWorkspaceStore();
  const { isLeftSidebarOpen, isRightSidebarOpen, theme } = useLayoutStore();
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Sync theme to DOM for persistence
  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  React.useEffect(() => {
    if (urlTenantId) {
      setTenantId(parseInt(urlTenantId));
    }
  }, [urlTenantId, setTenantId]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const [tenantRes, usersRes, docsRes, postsRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', tenantId).single(),
        supabase.from('users').select('*').eq('tenant_id', tenantId),
        supabase.from('documents').select('*, users(name)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('social_posts').select('*, users(name, role)').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      ]);

      if (tenantRes.error) throw tenantRes.error;
      
      return {
        tenant: {
          ...tenantRes.data,
          custom_labels: tenantRes.data.custom_labels ? (typeof tenantRes.data.custom_labels === 'string' ? JSON.parse(tenantRes.data.custom_labels) : tenantRes.data.custom_labels) : {}
        },
        users: usersRes.data || [],
        documents: docsRes.data || [],
        socialPosts: postsRes.data || []
      };
    },
    enabled: !!tenantId,
  });

  return (
    <div className="flex bg-zinc-50 dark:bg-[#1C1C1C] text-zinc-900 dark:text-white font-sans h-screen overflow-hidden">
      <div className={`hidden md:block transition-all duration-300 h-full shrink-0 ${isLeftSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <Sidebar tenantName={data?.tenant?.name} />
      </div>
      
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 h-full relative">
        <TopNavbar onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)} />
        <div className="flex-1 overflow-y-auto w-full relative">
          <Outlet />
        </div>
      </main>

      {/* Right Sidebar - Desktop Only */}
      <div className={`hidden lg:block transition-all duration-300 h-full shrink-0 ${isRightSidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
        <RightSidebar users={data?.users || []} />
      </div>

      <NotificationCenter 
        isOpen={isNotificationCenterOpen} 
        onClose={() => setIsNotificationCenterOpen(false)} 
      />

      {/* Mobile Bottom Navigation Layout mapped from template */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#1C1C1C]/90 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800/50 px-6 py-4 flex items-center justify-between z-50 pb-safe">
        <NavLink to={`/space/${tenantId}/overview`} className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <LayoutDashboard size={22} className={location.pathname.includes('overview') ? 'text-blue-500 drop-shadow-md' : ''} />
        </NavLink>
        <NavLink to={`/space/${tenantId}/north-star`} className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <Target size={22} />
        </NavLink>
        <NavLink to={`/space/${tenantId}/projects`} className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <Briefcase size={22} className={location.pathname.includes('/projects') ? 'text-yellow-500 drop-shadow-md' : ''} />
        </NavLink>
        <button onClick={() => setIsNotificationCenterOpen(true)} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white transition-colors relative">
          <Bell size={22} />
        </button>
        <NavLink to={`/space/${tenantId}/integrations`} className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <Settings size={22} />
        </NavLink>
        <NavLink to={`/space/${tenantId}/profile`} className={({ isActive }) => `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-white'}`}>
          <UserCircle size={22} />
        </NavLink>
      </div>
    </div>
  );
};
