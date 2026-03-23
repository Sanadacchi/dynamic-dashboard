/**
 * Browser-Side Persistence Layer (LocalStorage Mock)
 * 
 * This file intercepts /api calls and redirects them to a local storage database
 * when running in a static hosting environment (like Netlify) or when the 
 * local dev server is unavailable.
 */

const STORAGE_KEY = 'grahamly_db';

interface DB {
  tenants: any[];
  users: any[];
  projects: any[];
  tasks: any[];
  daily_goals: any[];
  north_stars: any[];
  achievements: any[];
  custom_widgets: any[];
  documents: any[];
  social_posts: any[];
  blockers: any[];
  eod_reports: any[];
}

const INITIAL_DB: DB = {
  tenants: [{
    id: 1,
    name: "Grahamly Corp",
    daily_burn: 500,
    total_balance: 25000,
    company_type: "Tech Startup",
    primary_color: "indigo",
    dashboard_layout: JSON.stringify([
      { id: 'w1', type: 'STAT_CARD', label: 'Runway Days', metricDataKey: 'runway', color: 'bg-blue-500', rolesRequired: ['OWNER', 'MANAGER'] },
      { id: 'w2', type: 'STAT_CARD', label: 'Daily Burn', metricDataKey: 'daily_burn', color: 'bg-zinc-800', rolesRequired: ['OWNER', 'MANAGER'] },
      { id: 'w3', type: 'NORTH_STAR', label: 'North Star', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] },
      { id: 'w4', type: 'WAR_ROOM', label: 'War Room', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] }
    ])
  }],
  users: [
    { id: 1, tenant_id: 1, name: "Alex Graham", role: "OWNER", status: "Online" },
    { id: 2, tenant_id: 1, name: "Sarah Manager", role: "MANAGER", status: "Focus" },
    { id: 3, tenant_id: 1, name: "John Dev", role: "CONTRIBUTOR", status: "Online" }
  ],
  projects: [{ id: 1, tenant_id: 1, name: "Main Runway" }],
  tasks: [],
  daily_goals: [],
  north_stars: [],
  achievements: [],
  custom_widgets: [],
  documents: [],
  social_posts: [],
  blockers: [],
  eod_reports: []
};

// In-memory fallback for browsers blocking LocalStorage (e.g. Zen/Firefox in Strict Mode)
let memoryDB = { ...INITIAL_DB };

const getDB = (): DB => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
      return INITIAL_DB;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.warn('LocalStorage access blocked (Zen/Firefox Strict Mode?). Falling back to in-memory storage.');
    return memoryDB;
  }
};

const saveDB = (db: DB) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    memoryDB = db;
  }
};

export const initMockBackend = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // In development, we only use mock mode if ?mock=true is present.
  // In production (Netlify), we ALWAYS use mock mode because there is no server.
  if (isLocal && !window.location.search.includes('mock=true')) {
    return;
  }

  console.log('%c🚀 Grahamly Mock Backend Activated', 'color: #6366f1; font-weight: bold; font-size: 14px;');
  console.log('Interception mode: Storage-only (LocalStorage)');

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let rawUrl: string;
    let method: string;
    let body: any = init?.body;

    if (typeof input === 'string') {
      rawUrl = input;
      method = init?.method?.toUpperCase() || 'GET';
    } else if (input instanceof URL) {
      rawUrl = input.href;
      method = init?.method?.toUpperCase() || 'GET';
    } else {
      // Must be a Request object
      rawUrl = (input as Request).url;
      method = init?.method?.toUpperCase() || (input as Request).method.toUpperCase();
      if (!body && method !== 'GET' && method !== 'HEAD') {
        try {
          // Clone the request because we can only read the body once
          body = await (input as Request).clone().text();
        } catch (e) {
          console.warn('Failed to clone request body:', e);
        }
      }
    }
    
    // Only intercept routes that contain /api/
    if (!rawUrl.includes('/api/')) {
      return originalFetch(input, init);
    }

    // Simulate network delay for a better UI state lifecycle
    await new Promise(resolve => setTimeout(resolve, 600));

    const url = new URL(rawUrl, window.location.origin);
    const path = url.pathname;
    const db = getDB();
    const headers = { 'Content-Type': 'application/json' };

    console.group(`📡 Mock API: ${method} ${path}`);
    if (body) console.log('Payload:', body);

    try {
      // --- Handle tenants ---
      if (path === '/api/tenants') {
        if (method === 'GET') {
          console.log('Returning tenants list:', db.tenants);
          console.groupEnd();
          return new Response(JSON.stringify(db.tenants), { status: 200, headers });
        }
        if (method === 'POST') {
          const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
          const newId = db.tenants.length > 0 ? Math.max(...db.tenants.map(t => t.id)) + 1 : 1;
          const newTenant = {
            id: newId,
            name: parsedBody.name,
            daily_burn: parsedBody.dailyBurn || 0,
            total_balance: parsedBody.totalBalance || 0,
            company_type: parsedBody.companyType,
            primary_color: parsedBody.primaryColor,
            custom_labels: parsedBody.customLabels ? JSON.stringify(parsedBody.customLabels) : null,
            dashboard_layout: JSON.stringify([
              { id: 'w1', type: 'STAT_CARD', label: 'Runway Days', metricDataKey: 'runway', color: 'bg-blue-500', rolesRequired: ['OWNER', 'MANAGER'] },
              { id: 'w2', type: 'NORTH_STAR', label: 'North Star', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] }
            ])
          };
          db.tenants.push(newTenant);

          // Auto-create an Admin user for the new tenant
          const newUserId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
          db.users.push({
            id: newUserId,
            tenant_id: newId,
            name: 'Admin',
            role: 'Owner',
            status: 'Offline'
          });

          saveDB(db);
          console.log('Created new tenant and Admin user:', newId);
          console.groupEnd();
          return new Response(JSON.stringify(newTenant), { status: 200, headers });
        }
      }

      // --- Handle dashboard ---
      const dashboardMatch = path.match(/\/api\/dashboard\/(\d+)/);
      if (dashboardMatch && method === 'GET') {
        const tenantId = parseInt(dashboardMatch[1]);
        const tenant = db.tenants.find(t => t.id === tenantId);
        const users = db.users.filter(u => u.tenant_id === tenantId);
        const data = {
          tenant: tenant ? { ...tenant, custom_labels: tenant.custom_labels ? JSON.parse(tenant.custom_labels) : {} } : null,
          users: users.map(u => ({ ...u, tasks: [], achievement: null })),
          dailyGoal: null,
          documents: [],
          socialPosts: []
        };
        console.log('Returning dashboard data for tenant:', tenantId);
        console.groupEnd();
        return new Response(JSON.stringify(data), { status: 200, headers });
      }

      // --- Handle users ---
      if (path === '/api/users') {
        if (method === 'POST') {
          const body = JSON.parse(init?.body as string);
          const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
          const newUser = {
            id: newId,
            tenant_id: body.tenantId,
            name: body.name,
            role: body.role || 'Contributor',
            status: 'Offline'
          };
          db.users.push(newUser);
          saveDB(db);
          console.log('Created new user:', newUser);
          console.groupEnd();
          return new Response(JSON.stringify(newUser), { status: 200, headers });
        }
      }

      // --- Handle user roles ---
      const roleMatch = path.match(/\/api\/users\/(\d+)\/role/);
      if (roleMatch && method === 'PATCH') {
        const userId = parseInt(roleMatch[1]);
        const body = JSON.parse(init?.body as string);
        const userIndex = db.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          db.users[userIndex].role = body.role;
          saveDB(db);
        }
        console.log('Updated user role:', userId, body.role);
        console.groupEnd();
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      // --- Handle war-room ---
      const warRoomMatch = path.match(/\/api\/war-room\/(\d+)/);
      if (warRoomMatch && method === 'GET') {
        const tenantId = parseInt(warRoomMatch[1]);
        const blockers = db.blockers.filter(b => b.tenant_id === tenantId);
        console.log('Returning war-room data for tenant:', tenantId);
        console.groupEnd();
        return new Response(JSON.stringify({ 
          blockers: blockers.map(b => ({ ...b, user: db.users.find(u => u.id === b.author_id)?.name || 'Unknown' })),
          hasSubmittedEod: false 
        }), { status: 200, headers });
      }

      console.warn(`⚠️ Mock Backend: Route not manually handled, passing through.`);
      console.groupEnd();
      return originalFetch(input, init);

    } catch (error) {
      console.error('❌ Mock Backend Error:', error);
      console.groupEnd();
      return originalFetch(input, init);
    }
  };
};
