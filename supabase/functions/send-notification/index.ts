/**
 * Supabase Edge Function: send-notification
 * 
 * This function triggers push notifications via OneSignal.
 * It supports both 'include_player_ids' (deprecated) and 'include_subscription_ids' (recommended).
 */

Deno.serve(async (req) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { headings, contents, include_player_ids, filters } = body;
    
    console.log("Incoming Request Data:", { headings, contents, include_player_ids, filters });

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    if (!ONESIGNAL_REST_API_KEY || !ONESIGNAL_APP_ID) {
      console.error("Missing Secrets: ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY");
      throw new Error("Missing Secrets! Check Supabase > Settings > API > Secrets");
    }

    // Determine target IDs
    // OneSignal shifted from 'include_player_ids' to 'include_subscription_ids'.
    // We Map both for backward/forward compatibility but prioritize subscription_ids.
    const targetIds = include_player_ids || [];

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      headings,
      contents,
      include_subscription_ids: targetIds, // Recommended
      filters,
      chrome_web_icon: 'https://grahamly.netlify.app/pwa-192x192.png'
    };

    console.log("Dispatching to OneSignal:", JSON.stringify({
      app_id: payload.app_id,
      targetCount: targetIds.length,
      hasFilters: !!filters
    }));

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (!response.ok) {
        console.error("OneSignal API Error:", data);
        return new Response(JSON.stringify({ 
            error: data.errors?.[0] || response.statusText,
            details: data 
        }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            status: response.status,
        });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error("Edge Function Runtime Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
