
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
      // NOTE: Using the REST API Key provided by the user
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': 'Basic os_v2_app_kdduuzafxbdj5b3wkjcjyurz7yrvcg7wjc4ujj5feenix3adt3ocpjf3b4zmqdl4jl5jbyneldgif7mbf32f37smfgu4w7riwe7c6iy'
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          headings: args.headings,
          contents: args.contents,
          include_player_ids: args.include_player_ids,
          filters: args.filters,
          chrome_web_icon: '/pwa-192x192.png'
        }),
      });

      const data = await response.json();
      console.log('OneSignal Trigger Result:', data);
      return data;
    } catch (err) {
      console.error('OneSignal Trigger Error:', err);
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
