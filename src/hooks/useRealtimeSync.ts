import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '../store/workspaceStore';

export const useRealtimeSync = () => {
  const queryClient = useQueryClient();
  const { currentTenantId } = useWorkspaceStore();

  useEffect(() => {
    if (!currentTenantId) return;

    console.log(`[Realtime] Subscribed to changes for tenant: ${currentTenantId}`);

    // Mocking a WebSocket / Supabase Realtime subscription
    // When a data mutation occurs (e.g. from another client), this polling simulates
    // the global state updating immediately so all logged-in clients in that tenantId see the change.
    const interval = setInterval(() => {
      // In a real app, this would be: supabase.channel('...').on('postgres_changes', ...)
      queryClient.invalidateQueries({ queryKey: ['dashboard', currentTenantId] });
      queryClient.invalidateQueries({ queryKey: ['customWidgets', currentTenantId] });
    }, 3000);

    return () => {
      console.log(`[Realtime] Unsubscribed from tenant: ${currentTenantId}`);
      clearInterval(interval);
    };
  }, [currentTenantId, queryClient]);
};
