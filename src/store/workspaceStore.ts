import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
  currentTenantId: number | null;
  currentUser: any | null;
  customMetrics: any[];
  taskVelocityMonthly: { label: string; current: number; previous: number }[];
  taskVelocityWeekly: { label: string; current: number; previous: number }[];
  analyticsData: any[];
  timeframe: 'weekly' | 'monthly';
  taskVelocityData: { label: string; current: number; previous: number }[];
  setTenantId: (id: number | null) => void;
  setCurrentUser: (user: any | null) => void;
  setCustomMetrics: (metrics: any[]) => void;
  addCustomMetric: (metric: any) => void;
  setTaskVelocityMonthly: (data: { label: string; current: number; previous: number }[]) => void;
  setTaskVelocityWeekly: (data: { label: string; current: number; previous: number }[]) => void;
  setTaskVelocityData: (data: { label: string; current: number; previous: number }[]) => void;
  addAnalyticsData: (data: any) => void;
  setTimeframe: (timeframe: 'weekly' | 'monthly') => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentTenantId: null,
      currentUser: null,
      customMetrics: [],
      analyticsData: [],
      taskVelocityMonthly: [
        { label: 'Jan', current: 30, previous: 25 },
        { label: 'Feb', current: 45, previous: 35 },
        { label: 'Mar', current: 60, previous: 55 },
        { label: 'Apr', current: 50, previous: 45 },
        { label: 'May', current: 80, previous: 70 },
        { label: 'Jun', current: 70, previous: 65 },
        { label: 'Jul', current: 100, previous: 90 },
      ],
      taskVelocityWeekly: [
        { label: 'Mon', current: 12, previous: 10 },
        { label: 'Tue', current: 18, previous: 12 },
        { label: 'Wed', current: 15, previous: 18 },
        { label: 'Thu', current: 22, previous: 15 },
        { label: 'Fri', current: 28, previous: 20 },
        { label: 'Sat', current: 10, previous: 8 },
        { label: 'Sun', current: 8, previous: 12 },
      ],
      timeframe: 'monthly',
      taskVelocityData: [
        { label: 'Jan', current: 30, previous: 25 },
        { label: 'Feb', current: 45, previous: 35 },
        { label: 'Mar', current: 60, previous: 55 },
        { label: 'Apr', current: 50, previous: 45 },
        { label: 'May', current: 80, previous: 70 },
        { label: 'Jun', current: 70, previous: 65 },
        { label: 'Jul', current: 100, previous: 90 },
      ],
      setTenantId: (id) => set({ currentTenantId: id }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setCustomMetrics: (metrics) => set({ customMetrics: metrics }),
      addCustomMetric: (metric) => set((state) => ({ 
        customMetrics: [...state.customMetrics, metric] 
      })),
      setTaskVelocityMonthly: (data) => set((state) => ({ 
        taskVelocityMonthly: data,
        taskVelocityData: state.timeframe === 'monthly' ? data : state.taskVelocityData
      })),
      setTaskVelocityWeekly: (data) => set((state) => ({ 
        taskVelocityWeekly: data,
        taskVelocityData: state.timeframe === 'weekly' ? data : state.taskVelocityData
      })),
      setTaskVelocityData: (data) => set({ taskVelocityData: data }),
      addAnalyticsData: (data) => set((state) => ({
        analyticsData: [...state.analyticsData, data]
      })),
      setTimeframe: (timeframe) => set((state) => ({ 
        timeframe,
        taskVelocityData: timeframe === 'monthly' ? state.taskVelocityMonthly : state.taskVelocityWeekly
      })),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
