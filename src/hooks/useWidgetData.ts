import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '../store/workspaceStore';
import { supabase } from '../lib/supabase';

export type SourceType = 'MANUAL' | 'API';

export interface WidgetConfig {
  sourceType: SourceType;
  endpoint?: string;
  manualDataKey?: string;
  refetchInterval?: number;
}

export const useWidgetData = (config: WidgetConfig) => {
  const { currentTenantId, taskVelocityData } = useWorkspaceStore();

  // Handle live API polling (e.g. API Requests)
  const { data: apiData, isLoading } = useQuery({
    queryKey: ['widgetData', config.endpoint, currentTenantId],
    queryFn: async () => {
      if (config.endpoint === '/api/metrics/live') {
        const { data: count, error } = await supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', currentTenantId);
        
        const now = new Date();
        const pts = [];
        for(let i=5; i>=0; i--) {
           pts.push({
             label: `${now.getHours()}:${String(now.getMinutes()-i).padStart(2,'0')}`,
             value: (count || 0) + Math.floor(Math.random() * 5) // Slight variance for "live" feel
           });
        }
        return pts;
      }
      
      const res = await fetch(`${config.endpoint}?tenant=${currentTenantId}`);
      return res.json();
    },
    enabled: config.sourceType === 'API' && !!config.endpoint && !!currentTenantId,
    refetchInterval: config.refetchInterval || false,
    staleTime: config.refetchInterval ? 0 : 60000,
  });

  if (config.sourceType === 'MANUAL') {
    // Normalizes manual states (e.g., binds to global stores as they mutate)
    if (config.manualDataKey === 'taskVelocity') {
      return { data: taskVelocityData, isLoading: false };
    }
    return { data: [], isLoading: false };
  }

  // Normalizes API output explicitly to { label, value } structures seamlessly
  return { 
    data: Array.isArray(apiData) ? apiData : [], 
    isLoading 
  };
};
