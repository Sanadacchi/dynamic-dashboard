import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '../store/workspaceStore';
import { supabase } from '../lib/supabase';

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useWorkspaceStore();

  useEffect(() => {
    if (!currentTenantId) return;

    console.log(`[Realtime] Subscribed to changes for tenant: ${currentTenantId}`);

    // Create a channel for all data changes in this tenant
    const channel = supabase
      .channel(`tenant-${currentTenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          console.log('[Realtime] Change detected:', payload);
          // Invalidate ALL relevant queries when any row changes
          // The table name is available in payload.table
          queryClient.invalidateQueries({ queryKey: [payload.table, currentTenantId] });
          // Fallback if the queryKey doesn't match the table name exactly
          queryClient.invalidateQueries({ queryKey: ['dashboard', currentTenantId] });
        }
      )
      .subscribe();

    return () => {
      console.log(`[Realtime] Unsubscribed from tenant: ${currentTenantId}`);
      supabase.removeChannel(channel);
    };
  }, [currentTenantId, queryClient]);
};
