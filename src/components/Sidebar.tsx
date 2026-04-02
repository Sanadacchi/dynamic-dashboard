import { NavLink, useParams } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Target, 
  UserCircle, 
  Briefcase, 
  FileText, 
  Settings, 
  MessageSquare,
  Zap
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, to }: { icon: any, label: string, to: string }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-zinc-200 text-zinc-900 dark:bg-white/5 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'}`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  </NavLink>
);

export const Sidebar = ({ tenantName }: { tenantName?: string }) => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const baseUrl = `/space/${tenantId}`;

  return (
    <aside className="hidden md:flex w-64 border-r border-zinc-200 dark:border-zinc-800 flex-col h-screen sticky top-0 bg-white dark:bg-[#1C1C1C] z-40">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-full flex items-center justify-center">
          <Zap size={18} className="text-white dark:text-black" />
        </div>
        <span className="font-bold text-zinc-900 dark:text-white">{tenantName || "Grahamly"}</span>
      </div>

      <div className="px-4 space-y-6 flex-1 overflow-y-auto pb-10">
        <div>
          <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Favorites</p>
          <SidebarItem icon={LayoutDashboard} label="Overview" to={`${baseUrl}/overview`} />
          <SidebarItem icon={Briefcase} label="Projects" to={`${baseUrl}/projects`} />
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Dashboards</p>
          <SidebarItem icon={TrendingUp} label="Analytics" to={`${baseUrl}/analytics`} />
          <SidebarItem icon={Users} label="War Room" to={`${baseUrl}/war-room`} />
          <SidebarItem icon={Target} label="North Star" to={`${baseUrl}/north-star`} />
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Pages</p>
          <SidebarItem icon={UserCircle} label="User Profile" to={`${baseUrl}/profile`} />
          <SidebarItem icon={FileText} label="Documents" to={`${baseUrl}/documents`} />
          <SidebarItem icon={MessageSquare} label="Social" to={`${baseUrl}/social`} />
        </div>
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <NavLink to={`${baseUrl}/integrations`} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg mb-6 cursor-pointer transition-colors ${isActive ? 'bg-zinc-200 text-zinc-900 dark:bg-white/5 dark:text-white' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'}`}>
          <Settings size={18} />
          <span className="text-sm font-medium">API & Integrations</span>
        </NavLink>

        <div className="text-center opacity-40 hover:opacity-100 transition-opacity pb-2">
          <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500">
            Powered by Grahamly
          </p>
        </div>
      </div>
    </aside>
  );
};
