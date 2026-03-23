import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface Milestone {
  id: string;
  label: string;
  isCompleted: boolean;
}

interface NorthStarState {
  objective: {
    title: string;
    description: string;
  };
  milestones: Milestone[];
  chartData: { name: string; value: number }[];
  isLoading: boolean;
  error: string | null;
  fetchNorthStar: (tenantId: number) => Promise<void>;
  updateObjective: (tenantId: number, data: { title: string; description: string; milestones: Milestone[] }) => Promise<void>;
  toggleMilestone: (tenantId: number, milestoneId: string) => Promise<void>;
}

export const useNorthStarStore = create<NorthStarState>((set, get) => ({
  objective: {
    title: 'Define your ultimate objective',
    description: 'The North Star Metric is the single key performance indicator that best captures the core value your product delivers to customers.'
  },
  milestones: [],
  chartData: [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 },
    { name: 'Jun', value: 900 },
  ],
  isLoading: false,
  error: null,

  fetchNorthStar: async (tenantId: number) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('north_star_title, north_star_description, north_star_milestones, north_star_chart_data')
        .eq('id', tenantId)
        .single();
      
      if (error) throw error;
      
      set({
        objective: {
          title: data.north_star_title || 'Define your objective',
          description: data.north_star_description || '',
        },
        milestones: data.north_star_milestones ? (typeof data.north_star_milestones === 'string' ? JSON.parse(data.north_star_milestones) : data.north_star_milestones) : [],
        chartData: data.north_star_chart_data ? (typeof data.north_star_chart_data === 'string' ? JSON.parse(data.north_star_chart_data) : data.north_star_chart_data) : [
          { name: 'Jan', value: 400 },
          { name: 'Feb', value: 300 },
          { name: 'Mar', value: 600 },
          { name: 'Apr', value: 800 },
          { name: 'May', value: 500 },
          { name: 'Jun', value: 900 },
        ],
        isLoading: false
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateObjective: async (tenantId: number, data: { title: string; description: string; milestones: Milestone[]; chartData?: any[] }) => {
    const { chartData: currentChartData } = get();
    const finalChartData = data.chartData || currentChartData;
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          north_star_title: data.title, 
          north_star_description: data.description,
          north_star_milestones: data.milestones,
          north_star_chart_data: finalChartData
        })
        .eq('id', tenantId);
      
      if (error) throw error;
      
      set({ 
        objective: { title: data.title, description: data.description },
        milestones: data.milestones,
        chartData: finalChartData
      });
    } catch (err) {
      console.error('Failed to update objective:', err);
    }
  },

  toggleMilestone: async (tenantId: number, milestoneId: string) => {
    const { milestones } = get();
    const updated = milestones.map(m => 
      m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
    );
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ north_star_milestones: updated })
        .eq('id', tenantId);
      if (error) throw error;
      set({ milestones: updated });
    } catch (err) {
      console.error('Failed to toggle milestone:', err);
    }
  }
}));
