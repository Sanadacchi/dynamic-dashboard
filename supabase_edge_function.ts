import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { headings, contents, include_player_ids, filters } = await req.json();
    console.log("Incoming Request Data:", { headings, contents, include_player_ids, filters });

    const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID");
    const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");

    console.log("Secrets Found:", { 
      appId: ONESIGNAL_APP_ID ? "YES (first 4: " + ONESIGNAL_APP_ID.substring(0,4) + ")" : "NO",
      apiKey: ONESIGNAL_REST_API_KEY ? "YES" : "NO" 
    });

    if (!ONESIGNAL_REST_API_KEY || !ONESIGNAL_APP_ID) {
      throw new Error("Missing Secrets! Check Supabase > Settings > API > Secrets");
    }

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      headings,
      contents,
      include_player_ids,
      filters,
      chrome_web_icon: 'https://grahamly.netlify.app/pwa-192x192.png'
    };

    console.log("FINAL PAYLOAD TO ONESIGNAL:", JSON.stringify(payload));

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("OneSignal Response Data:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
