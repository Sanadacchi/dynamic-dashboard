import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useWorkspaceStore } from './workspaceStore';

export interface Milestone {
  id: string;
  label: string;
  isCompleted: boolean;
}

export interface NorthStarState {
  objective: { title: string; description: string };
  milestones: Milestone[];
  chartData: { name: string; value: number }[];
  fetchNorthStar: (tenantId: number) => Promise<void>;
  updateObjective: (tenantId: number, data: { title: string, description: string, milestones: Milestone[] }) => Promise<void>;
  toggleMilestone: (tenantId: number, id: string) => Promise<void>;
}

export const useNorthStarStore = create<NorthStarState>((set) => ({
  objective: {
    title: "Define your ultimate objective",
    description: "The North Star Metric is the single key performance indicator that best captures the core value your product delivers to customers."
  },
  milestones: [],
  chartData: [
    { name: 'Jan', value: 30 },
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 60 },
    { name: 'Apr', value: 50 },
    { name: 'May', value: 80 },
    { name: 'Jun', value: 70 },
    { name: 'Jul', value: 100 }
  ],
  fetchNorthStar: async (tenantId) => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('north_star_title, north_star_description, north_star_milestones')
        .eq('id', tenantId)
        .single();

      if (error) throw error;
      if (data) {
        set({ 
          objective: { title: data.north_star_title, description: data.north_star_description }, 
          milestones: data.north_star_milestones || [] 
        });
      }
    } catch (e) {
      console.error('Failed to load North Star', e);
    }
  },
  updateObjective: async (tenantId, data) => {
    if (!tenantId) return;
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          north_star_title: data.title,
          north_star_description: data.description,
          north_star_milestones: data.milestones
        })
        .eq('id', tenantId);

      if (error) throw error;
      set({ objective: { title: data.title, description: data.description }, milestones: data.milestones });
    } catch (e) {
      console.error('Failed to save North Star', e);
    }
  },
  toggleMilestone: async (tenantId, id) => {
    if (!tenantId) return;
    
    let updatedMilestones: Milestone[] = [];
    let currentObjective: { title: string, description: string } = { title: '', description: '' };

    set((state) => {
      updatedMilestones = state.milestones.map(m => m.id === id ? { ...m, isCompleted: !m.isCompleted } : m);
      currentObjective = state.objective;
      return { milestones: updatedMilestones };
    });

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          north_star_milestones: updatedMilestones
        })
        .eq('id', tenantId);

      if (error) throw error;
    } catch (e) {
      console.error('Failed to toggle milestone', e);
    }
  }
}));
