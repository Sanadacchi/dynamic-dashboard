import { useQuery } from '@tanstack/react-query';
import { useWorkspaceStore } from '../store/workspaceStore';

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
        // Mock a dynamically moving endpoint return for API Requests / min
        const now = new Date();
        const pts = [];
        for(let i=5; i>=0; i--) {
           pts.push({
             label: `${now.getHours()}:${String(now.getMinutes()-i).padStart(2,'0')}`,
             value: Math.floor(Math.random() * 500) + 100
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
