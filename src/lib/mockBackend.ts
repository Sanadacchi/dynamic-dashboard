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

// Initialize DB from localStorage or defaults
const getDB = (): DB => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DB));
    return INITIAL_DB;
  }
  return JSON.parse(stored);
};

const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const initMockBackend = () => {
  // Only intercept if we're in production or if requested
  const isNetlify = window.location.hostname.includes('netlify.app');
  const isLocal = window.location.hostname === 'localhost';
  
  // We'll intercept in production always, and for local dev it lets us test the mock
  if (!isNetlify && isLocal) {
     console.log('Mock Backend: Local environment detected, using real server if available.');
     // Optionally allow forcing mock mode with ?mock=true
     if (!window.location.search.includes('mock=true')) return;
  }

  console.warn('🚀 Mock Backend Active: Intercepting API calls to LocalStorage');

  const originalFetch = window.fetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = input.toString();
    
    // Only intercept /api routes
    if (!url.includes('/api/')) {
      return originalFetch(input, init);
    }

    const db = getDB();
    const headers = { 'Content-Type': 'application/json' };

    try {
      // --- Handle GET /api/tenants ---
      if (url.endsWith('/api/tenants') && init?.method === 'GET' || !init?.method) {
        return new Response(JSON.stringify(db.tenants), { status: 200, headers });
      }

      // --- Handle POST /api/tenants ---
      if (url.endsWith('/api/tenants') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        const newId = db.tenants.length > 0 ? Math.max(...db.tenants.map(t => t.id)) + 1 : 1;
        const newTenant = {
          id: newId,
          name: body.name,
          daily_burn: body.dailyBurn || 0,
          total_balance: body.totalBalance || 0,
          company_type: body.companyType,
          primary_color: body.primaryColor,
          custom_labels: body.customLabels ? JSON.stringify(body.customLabels) : null,
          dashboard_layout: JSON.stringify([
            { id: 'w1', type: 'STAT_CARD', label: 'Runway Days', metricDataKey: 'runway', color: 'bg-blue-500', rolesRequired: ['OWNER', 'MANAGER'] },
            { id: 'w2', type: 'NORTH_STAR', label: 'North Star', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] }
          ])
        };
        db.tenants.push(newTenant);
        saveDB(db);
        return new Response(JSON.stringify(newTenant), { status: 200, headers });
      }

      // --- Handle GET /api/dashboard/:id ---
      const dashboardMatch = url.match(/\/api\/dashboard\/(\d+)/);
      if (dashboardMatch && (init?.method === 'GET' || !init?.method)) {
        const tenantId = parseInt(dashboardMatch[1]);
        const tenant = db.tenants.find(t => t.id === tenantId);
        const users = db.users.filter(u => u.tenant_id === tenantId);
        // Simplification for mock
        return new Response(JSON.stringify({
          tenant: { ...tenant, custom_labels: tenant.custom_labels ? JSON.parse(tenant.custom_labels) : {} },
          users: users.map(u => ({ ...u, tasks: [], achievement: null })),
          dailyGoal: null,
          documents: [],
          socialPosts: []
        }), { status: 200, headers });
      }

      // --- Handle POST /api/users ---
      if (url.endsWith('/api/users') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
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
        return new Response(JSON.stringify(newUser), { status: 200, headers });
      }

      // --- Handle PATCH /api/users/:id/role ---
      const roleMatch = url.match(/\/api\/users\/(\d+)\/role/);
      if (roleMatch && init?.method === 'PATCH') {
        const userId = parseInt(roleMatch[1]);
        const body = JSON.parse(init.body as string);
        const userIndex = db.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
          db.users[userIndex].role = body.role;
          saveDB(db);
        }
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      // --- Handle GET /api/war-room/:tenantId ---
      const warRoomMatch = url.match(/\/api\/war-room\/(\d+)/);
      if (warRoomMatch && (init?.method === 'GET' || !init?.method)) {
        const tenantId = parseInt(warRoomMatch[1]);
        const blockers = db.blockers.filter(b => b.tenant_id === tenantId);
        // Simple mock for War Room
        return new Response(JSON.stringify({ 
          blockers: blockers.map(b => ({ ...b, user: db.users.find(u => u.id === b.author_id)?.name || 'Unknown' })),
          hasSubmittedEod: false 
        }), { status: 200, headers });
      }

      // --- Handle POST /api/blockers ---
      if (url.endsWith('/api/blockers') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string);
        const newId = db.blockers.length > 0 ? Math.max(...db.blockers.map(b => b.id)) + 1 : 1;
        const newBlocker = {
          id: newId,
          tenant_id: body.tenantId,
          author_id: body.authorId,
          task: body.task,
          blocker_text: body.blocker_text,
          is_escalated: body.is_escalated,
          created_at: new Date().toISOString()
        };
        db.blockers.push(newBlocker);
        saveDB(db);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers });
      }

      // Fallback for other /api routes
      console.log(`Mock Backend: Unhandled route ${init?.method || 'GET'} ${url}, passing through.`);
      return originalFetch(input, init);

    } catch (error) {
      console.error('Mock Backend Error:', error);
      return originalFetch(input, init);
    }
  };
};
