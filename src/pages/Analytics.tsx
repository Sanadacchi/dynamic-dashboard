import React, { useState, useMemo } from 'react';
import { Download, Filter, CalendarDays, BarChart2, GitCommit, GitPullRequest, Beaker, Plus } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, subMonths } from 'date-fns';
import { AddAnalyticsDataModal } from '../components/AddAnalyticsDataModal';

// Simulated complex API data
const generateData = (days: number, users: any[], multiplier = 1, compare = false) => {
  return []; // Cleared mock data. Await backend telemetry integration.
};

export const Analytics = () => {
  const { currentTenantId, analyticsData, addAnalyticsData } = useWorkspaceStore();
  const { data } = useQuery<any>({ queryKey: ['dashboard', currentTenantId?.toString()] });
  const users = data?.users || [];

  const [dateRange, setDateRange] = useState('7D');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'velocity' | 'bugs'>('velocity');
  const [comparePrevious, setComparePrevious] = useState(false);
  const [selectedUser, setSelectedUser] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Reactively calculate the active dataset
  const rawData = useMemo(() => {
    return [...analyticsData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [analyticsData]);

  const filteredData = useMemo(() => {
    if (selectedUser === 'All') return rawData;
    return rawData.filter(d => d.user === selectedUser);
  }, [rawData, selectedUser]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (!filteredData.length) return;
    const headers = Object.keys(filteredData[0]).join(',');
    const rows = filteredData.map(row => Object.values(row).join(',')).join('\\n');
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\\n" + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_export_${dateRange}_${selectedMetric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metricColors = {
    revenue: '#10b981', // Emerald
    velocity: '#6366f1', // Indigo
    bugs: '#f43f5e' // Rose
  };

  // Pagination bounds
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      {/* Header and Title */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <BarChart2 className="text-indigo-500" /> Analytics Explorer
        </h2>
        <p className="text-zinc-500 text-sm mt-1">Deep dive queries and granular metric segmentation.</p>
      </div>

      {/* Control Header Area */}
      <div className="bg-slate-950/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Date Ranges & Segment Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-white/5 border border-zinc-800 rounded-xl p-1">
            {['7D', '30D', '90D'].map(range => (
              <button
                key={range}
                onClick={() => { setDateRange(range); setCurrentPage(1); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${dateRange === range ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-800 hidden md:block" />

          <div className="relative group w-full md:w-auto flex-1 md:flex-none">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Filter size={14} className="text-zinc-500" />
            </div>
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-white/5 border border-zinc-800 text-zinc-300 text-sm rounded-xl pl-9 pr-8 py-2 outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="All">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right side toggles and export */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          <label className="flex items-center gap-2 cursor-pointer group hidden md:flex">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={comparePrevious} onChange={() => setComparePrevious(!comparePrevious)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${comparePrevious ? 'bg-indigo-500' : 'bg-zinc-800'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${comparePrevious ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Compare Historical</span>
          </label>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0 shadow-lg shadow-indigo-500/20"
          >
            <Plus size={16} /> Add Data
          </button>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors shrink-0"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Chart Viewer */}
      <div className="bg-slate-950/50 backdrop-blur-md border border-zinc-800 rounded-3xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white capitalize">{selectedMetric} Analytics</h3>
            <p className="text-sm text-zinc-500 mt-1">Aggregated historical visualization</p>
          </div>
          
          <div className="flex bg-white/5 border border-zinc-800 rounded-xl p-1">
            {(['velocity', 'revenue', 'bugs'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`capitalize px-4 py-2 text-xs font-bold rounded-lg transition-colors ${selectedMetric === metric ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-white'}`}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricColors[selectedMetric]} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={metricColors[selectedMetric]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickMargin={10} axisLine={false} />
              <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => selectedMetric === 'revenue' ? `$${val}` : val} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                itemStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                name={`Current ${selectedMetric}`}
                stroke={metricColors[selectedMetric]} 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
                strokeWidth={3}
                animationDuration={500}
              />
              
              {comparePrevious && (
                <Area 
                  type="monotone" 
                  dataKey={`historical_${selectedMetric}`} 
                  name={`Historical ${selectedMetric}`}
                  stroke="#52525b" 
                  fill="transparent" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  animationDuration={500}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Granular Drill-Down Data Table */}
      <div className="bg-slate-950/50 backdrop-blur-md border border-zinc-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-md font-bold text-white">Granular Datapoints</h3>
          <span className="text-xs font-bold text-zinc-500 bg-white/5 px-3 py-1 rounded-full">{filteredData.length} Records</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Segment</th>
                <th className="px-6 py-4 font-bold text-right">Velocity</th>
                <th className="px-6 py-4 font-bold text-right">Revenue</th>
                <th className="px-6 py-4 font-bold text-right">Bugs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{row.date}</td>
                  <td className="px-6 py-4 text-zinc-400 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-bold">
                      {row.user.charAt(0)}
                    </div>
                    {row.user}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-300 text-right">{row.velocity}</td>
                  <td className="px-6 py-4 font-mono text-emerald-400 text-right">${row.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 font-mono text-rose-400 text-right">{row.bugs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Constraints */}
        <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-sm">
          <p className="text-zinc-500">Showing page <span className="text-white font-bold">{currentPage}</span> of {totalPages || 1}</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Prev
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

      </div>

      <AddAnalyticsDataModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={addAnalyticsData} 
        users={users} 
      />
    </div>
  );
};
