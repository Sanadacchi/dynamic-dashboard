import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Milestone {
  id: string;
  label: string;
  isCompleted: boolean;
}

interface NorthStarState {
  title: string;
  description: string;
  milestones: Milestone[];
  isLoading: boolean;
  error: string | null;
  fetchMilestones: (tenantId: number) => Promise<void>;
  updateObjective: (tenantId: number, title: string, description: string) => Promise<void>;
  toggleMilestone: (tenantId: number, milestoneId: string) => Promise<void>;
  addMilestone: (tenantId: number, label: string) => Promise<void>;
  removeMilestone: (tenantId: number, milestoneId: string) => Promise<void>;
}

export const useNorthStarStore = create<NorthStarState>((set, get) => ({
  title: '',
  description: '',
  milestones: [],
  isLoading: false,
  error: null,

  fetchMilestones: async (tenantId: number) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('north_star_title, north_star_description, north_star_milestones')
        .eq('id', tenantId)
        .single();
      
      if (error) throw error;
      
      set({
        title: data.north_star_title || 'Define your objective',
        description: data.north_star_description || '',
        milestones: data.north_star_milestones ? (typeof data.north_star_milestones === 'string' ? JSON.parse(data.north_star_milestones) : data.north_star_milestones) : [],
        isLoading: false
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateObjective: async (tenantId: number, title: string, description: string) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ north_star_title: title, north_star_description: description })
        .eq('id', tenantId);
      if (error) throw error;
      set({ title, description });
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
  },

  addMilestone: async (tenantId: number, label: string) => {
    const { milestones } = get();
    const newMilestone = { id: Math.random().toString(36).substr(2, 9), label, isCompleted: false };
    const updated = [...milestones, newMilestone];
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ north_star_milestones: updated })
        .eq('id', tenantId);
      if (error) throw error;
      set({ milestones: updated });
    } catch (err) {
      console.error('Failed to add milestone:', err);
    }
  },

  removeMilestone: async (tenantId: number, milestoneId: string) => {
    const { milestones } = get();
    const updated = milestones.filter(m => m.id !== milestoneId);
    
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ north_star_milestones: updated })
        .eq('id', tenantId);
      if (error) throw error;
      set({ milestones: updated });
    } catch (err) {
      console.error('Failed to remove milestone:', err);
    }
  }
}));
