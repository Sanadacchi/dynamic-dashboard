
import { supabase } from './supabase';

const ONESIGNAL_APP_ID = '50c74a64-05b8-469e-8776-52449c5239fe';

export const notificationService = {
  /**
   * Triggers a notification via OneSignal
   * Note: In a real production app, this logic should happen in a Supabase Edge Function
   * to keep your OneSignal REST API Key secret.
   */
  sendNotification: async (args: {
    headings: { en: string };
    contents: { en: string };
    include_player_ids?: string[];
    filters?: any[];
  }) => {
    try {
      // Call the Supabase Edge Function instead of OneSignal directly
      // This keeps your REST API Key secret on the server.
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: args
      });

      if (error) throw error;
      console.log('Notification triggered:', data);
      return data;
    } catch (err) {
      console.error('Notification Error:', err);
      throw err;
    }
  },

  /**
   * Notifies all users in a tenant except the sender
   */
  notifyTeam: async (tenantId: number, excludeUserId: number, title: string, message: string) => {
    // 1. Fetch all users in the tenant who have a onesignal_id
    const { data: users, error } = await supabase
      .from('users')
      .select('onesignal_id')
      .eq('tenant_id', tenantId)
      .neq('id', excludeUserId)
      .not('onesignal_id', 'is', null);

    if (error) throw error;

    const playerIds = users?.map(u => u.onesignal_id).filter(Boolean) as string[];

    if (playerIds.length === 0) return;

    return notificationService.sendNotification({
      headings: { en: title },
      contents: { en: message },
      include_player_ids: playerIds
    });
  }
};
