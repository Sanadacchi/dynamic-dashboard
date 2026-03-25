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
        const windowMinutes = 6;
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        
        const { data: activities, error } = await supabase
          .from('activity_log')
          .select('points, created_at')
          .eq('tenant_id', currentTenantId)
          .gte('created_at', tenMinutesAgo);

        if (error) {
          console.error('Failed to fetch momentum data', error);
          return [];
        }

        const now = new Date();
        const pts = [];
        
        for(let i=windowMinutes-1; i>=0; i--) {
           const windowStart = new Date(now.getTime() - (i + 1) * 60000);
           const windowEnd = new Date(now.getTime() - i * 60000);
           
           const minutePoints = (activities || []).reduce((sum, act) => {
             const d = new Date(act.created_at);
             if (d >= windowStart && d < windowEnd) {
               return sum + (act.points || 0);
             }
             return sum;
           }, 0);

           pts.push({
             label: `${windowEnd.getHours()}:${String(windowEnd.getMinutes()).padStart(2,'0')}`,
             value: minutePoints
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
