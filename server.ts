import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import crypto from "crypto";
import path from "path";
import multer from "multer";
import fs from "fs";
const __dirname = path.resolve();

const db = new Database("grahamly.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    daily_burn REAL DEFAULT 0,
    total_balance REAL DEFAULT 0,
    company_type TEXT,
    dashboard_layout TEXT,
    primary_color TEXT,
    custom_labels TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    name TEXT NOT NULL,
    role TEXT,
    status TEXT DEFAULT 'Offline',
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    project_id INTEGER,
    user_id INTEGER,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'Planned',
    is_blocked INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(project_id) REFERENCES projects(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    goal_text TEXT,
    category TEXT,
    date DATE DEFAULT (DATE('now')),
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS north_stars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER UNIQUE,
    title TEXT,
    description TEXT,
    milestones TEXT DEFAULT '[]',
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    tenant_id INTEGER,
    text TEXT,
    date DATE DEFAULT (DATE('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS custom_widgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    user_id INTEGER,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    current_value REAL DEFAULT 0,
    goal_value REAL,
    config TEXT,
    created_at DATE DEFAULT (DATE('now')),
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATE DEFAULT (DATE('now')),
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    uploaded_by INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(uploaded_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    author_id INTEGER,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blockers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
     tenant_id INTEGER,
    author_id INTEGER,
    task TEXT NOT NULL,
    blocker_text TEXT NOT NULL,
    is_escalated BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS eod_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    author_id INTEGER,
    report_text TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(author_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER,
    user_id INTEGER,
    action_type TEXT,
    points INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Add api_key column if it doesn't exist
try {
  db.exec("ALTER TABLE tenants ADD COLUMN api_key TEXT UNIQUE;");
} catch (e) {
  // Column already exists
}

// Migrate: drop CHECK constraint on users.role if it exists (SQLite requires table recreation)
{
  const usersDDL = (db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as any)?.sql ?? '';
  if (usersDDL.includes('CHECK')) {
    db.pragma('foreign_keys = OFF');
    db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER,
        name TEXT NOT NULL,
        role TEXT,
        status TEXT DEFAULT 'Offline',
        FOREIGN KEY(tenant_id) REFERENCES tenants(id)
      );
      INSERT INTO users_new SELECT * FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
    `);
    db.pragma('foreign_keys = ON');
    console.log('Migration: removed CHECK constraint from users.role');
  }
}

// Seed data if empty
const tenantCount = db.prepare("SELECT COUNT(*) as count FROM tenants").get() as { count: number };
if (tenantCount.count === 0) {
  const defaultTechStartupLayout = JSON.stringify([
    { id: 'w1', type: 'STAT_CARD', label: 'Runway Days', metricDataKey: 'runway', color: 'bg-blue-500', rolesRequired: ['OWNER', 'MANAGER'] },
    { id: 'w2', type: 'STAT_CARD', label: 'Daily Burn', metricDataKey: 'daily_burn', color: 'bg-zinc-800', rolesRequired: ['OWNER', 'MANAGER'] },
    { id: 'w3', type: 'NORTH_STAR', label: 'North Star', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] },
    { id: 'w4', type: 'WAR_ROOM', label: 'War Room', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] }
  ]);
  const insertTenant = db.prepare("INSERT INTO tenants (name, daily_burn, total_balance, company_type, dashboard_layout) VALUES (?, ?, ?, ?, ?)");
  const tenantId = insertTenant.run("Grahamly Corp", 500, 25000, "Tech Startup", defaultTechStartupLayout).lastInsertRowid;

  const insertUser = db.prepare("INSERT INTO users (tenant_id, name, role, status) VALUES (?, ?, ?, ?)");
  insertUser.run(tenantId, "Alex Graham", "OWNER", "Online");
  insertUser.run(tenantId, "Sarah Manager", "MANAGER", "Focus");
  insertUser.run(tenantId, "John Dev", "CONTRIBUTOR", "Online");
  insertUser.run(tenantId, "Emma Designer", "CONTRIBUTOR", "Offline");

  const insertProject = db.prepare("INSERT INTO projects (tenant_id, name) VALUES (?, ?)");
  const projectId = insertProject.run(tenantId, "Main Runway").lastInsertRowid;

  const insertTask = db.prepare("INSERT INTO tasks (tenant_id, project_id, user_id, title, status, is_blocked) VALUES (?, ?, ?, ?, ?, ?)");
  insertTask.run(tenantId, projectId, 1, "Review Q1 Financials", "Planned", 0);
  insertTask.run(tenantId, projectId, 2, "Team Sync", "Completed", 0);
  insertTask.run(tenantId, projectId, 3, "Fix critical bug in auth", "Planned", 1);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  const upload = multer({ dest: 'uploads/' });

  const PORT = 3000;

  // API Routes
  app.get("/api/tenants", (req, res) => {
    const tenants = db.prepare("SELECT * FROM tenants").all();
    res.json(tenants);
  });

  app.post("/api/tenants", (req, res) => {
    const { name, dailyBurn, totalBalance, companyType, primaryColor, customLabels } = req.body;
    let layout = "[]";
    if (companyType === 'Tech Startup') {
      layout = JSON.stringify([
        { id: 'w1', type: 'STAT_CARD', label: 'Runway Days', metricDataKey: 'runway', color: 'bg-blue-500', rolesRequired: ['OWNER', 'MANAGER'] },
        { id: 'w2', type: 'NORTH_STAR', label: 'North Star', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] }
      ]);
    } else if (companyType === 'Agency') {
      layout = JSON.stringify([
        { id: 'w1', type: 'STAT_CARD', label: 'Billable Hours', metricDataKey: 'billable_hours', color: 'bg-indigo-500', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] },
        { id: 'w2', type: 'NORTH_STAR', label: 'Client Focus', rolesRequired: ['OWNER', 'MANAGER', 'CONTRIBUTOR'] }
      ]);
    } else if (companyType === 'Individual Creator') {
      layout = JSON.stringify([
        { id: 'w1', type: 'STAT_CARD', label: 'Social Reach', metricDataKey: 'social_reach', color: 'bg-pink-500', rolesRequired: ['OWNER', 'CONTRIBUTOR'] },
        { id: 'w2', type: 'NORTH_STAR', label: 'Project Progress', rolesRequired: ['OWNER', 'CONTRIBUTOR'] }
      ]);
    }

    const labelsString = customLabels ? JSON.stringify(customLabels) : null;

    const insert = db.prepare("INSERT INTO tenants (name, daily_burn, total_balance, company_type, dashboard_layout, primary_color, custom_labels) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const info = insert.run(name, dailyBurn || 0, totalBalance || 0, companyType || 'Tech Startup', layout, primaryColor || null, labelsString);
    const tenant = db.prepare("SELECT * FROM tenants WHERE id = ?").get(info.lastInsertRowid);
    res.json(tenant);
  });

  app.post("/api/users", (req, res) => {
    const { tenantId, name, role } = req.body;
    const insert = db.prepare("INSERT INTO users (tenant_id, name, role, status) VALUES (?, ?, ?, ?)");
    const info = insert.run(tenantId, name, role || 'Contributor', 'Offline');
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    res.json(user);
  });

  app.patch("/api/users/:id/role", (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !role.trim()) return res.status(400).json({ error: 'Role is required' });
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role.trim(), id);
    res.json({ success: true });
  });

  app.put("/api/users/:id", (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;
    db.prepare("UPDATE users SET name = ?, role = ? WHERE id = ?").run(name, role || 'Contributor', id);
    res.json({ success: true, user: { id: parseInt(id), name, role } });
  });

  app.delete("/api/users/:id", (req, res) => {
    const { id } = req.params;
    
    const transaction = db.transaction(() => {
      // Clean up dependent records explicitly to avoid FK constraint errors
      db.prepare("DELETE FROM tasks WHERE user_id = ?").run(id);
      db.prepare("DELETE FROM achievements WHERE user_id = ?").run(id);
      db.prepare("DELETE FROM custom_widgets WHERE user_id = ?").run(id);
      // Finally delete the user
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
    });
    
    transaction();
    res.json({ success: true });
  });

  app.get("/api/dashboard/:tenantId", (req, res) => {
    const { tenantId } = req.params;
    const tenant = db.prepare("SELECT * FROM tenants WHERE id = ?").get(tenantId) as any;
    const users = db.prepare("SELECT * FROM users WHERE tenant_id = ?").all(tenantId);
    const dailyGoal = db.prepare("SELECT * FROM daily_goals WHERE tenant_id = ? AND date = DATE('now')").get(tenantId);
    
    // Get tasks for each user
    const usersWithTasks = users.map((user: any) => {
      const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ? AND created_at = DATE('now')").all(user.id);
      const achievement = db.prepare("SELECT * FROM achievements WHERE user_id = ? AND date = DATE('now')").get(user.id);
      return { ...user, tasks, achievement };
    });

    // Parse custom_labels so panel overrides are available on the frontend
    const tenantWithParsedLabels = {
      ...tenant,
      custom_labels: tenant?.custom_labels ? JSON.parse(tenant.custom_labels) : {}
    };

    const documents = db.prepare("SELECT documents.*, users.name as uploader_name FROM documents LEFT JOIN users ON documents.uploaded_by = users.id WHERE documents.tenant_id = ? ORDER BY documents.created_at DESC").all(tenantId);
    const socialPosts = db.prepare("SELECT social_posts.*, users.name as author_name, users.role as author_role FROM social_posts LEFT JOIN users ON social_posts.author_id = users.id WHERE social_posts.tenant_id = ? ORDER BY social_posts.created_at DESC").all(tenantId);

    res.json({ tenant: tenantWithParsedLabels, users: usersWithTasks, dailyGoal, documents, socialPosts });
  });

  app.get("/api/tenants/:id/north-star", (req, res) => {
    const id = parseInt(req.params.id, 10);
    let ns = db.prepare("SELECT * FROM north_stars WHERE tenant_id = ?").get(id) as any;
    if (!ns) {
      const defaultMilestones = JSON.stringify([
        { id: '1', label: 'Launch MVP to 100 users', isCompleted: false },
        { id: '2', label: 'Integrate billing system', isCompleted: true },
        { id: '3', label: 'Secure seed funding', isCompleted: false }
      ]);
      db.prepare("INSERT INTO north_stars (tenant_id, title, description, milestones) VALUES (?, ?, ?, ?)").run(id, "Define your ultimate objective", "The North Star Metric is the single key performance indicator that best captures the core value your product delivers to customers.", defaultMilestones);
      ns = db.prepare("SELECT * FROM north_stars WHERE tenant_id = ?").get(id) as any;
    }
    res.json({ title: ns.title, description: ns.description, milestones: JSON.parse(ns.milestones) });
  });

  app.put("/api/tenants/:id/north-star", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, description, milestones } = req.body;
    db.prepare(`
      INSERT INTO north_stars (tenant_id, title, description, milestones) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(tenant_id) DO UPDATE SET 
        title = excluded.title, 
        description = excluded.description, 
        milestones = excluded.milestones
    `).run(id, title, description, JSON.stringify(milestones || []));
    
    console.log(`[NorthStar] UPSERTED objective update for tenant_id ${id}`);
    res.json({ success: true });
  });

  app.post("/api/daily-goal", (req, res) => {
    const { tenantId, goalText, category } = req.body;
    const existing = db.prepare("SELECT id FROM daily_goals WHERE tenant_id = ? AND date = DATE('now')").get(tenantId) as { id: number } | undefined;
    if (existing) {
      db.prepare("UPDATE daily_goals SET goal_text = ?, category = ? WHERE id = ?").run(goalText, category || null, existing.id);
    } else {
      db.prepare("INSERT INTO daily_goals (tenant_id, goal_text, category) VALUES (?, ?, ?)").run(tenantId, goalText, category || null);
    }
    res.json({ success: true });
  });

  app.post("/api/tasks/toggle-blocker", (req, res) => {
    const { taskId, isBlocked } = req.body;
    db.prepare("UPDATE tasks SET is_blocked = ? WHERE id = ?").run(isBlocked ? 1 : 0, taskId);
    res.json({ success: true });
  });

  app.post("/api/tasks/complete", (req, res) => {
    const { taskId } = req.body;
    db.prepare("UPDATE tasks SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?").run(taskId);
    res.json({ success: true });
  });

  app.post("/api/achievements", (req, res) => {
    const { userId, tenantId, text } = req.body;
    const existing = db.prepare("SELECT id FROM achievements WHERE user_id = ? AND date = DATE('now')").get(userId) as { id: number } | undefined;
    if (existing) {
      db.prepare("UPDATE achievements SET text = ? WHERE id = ?").run(text, existing.id);
    } else {
      db.prepare("INSERT INTO achievements (user_id, tenant_id, text) VALUES (?, ?, ?)").run(userId, tenantId, text);
    }
    res.json({ success: true });
  });

  app.get("/api/critical-alerts/:tenantId", (req, res) => {
    const { tenantId } = req.params;
    const alerts = db.prepare(`
      SELECT tasks.*, users.name as user_name 
      FROM tasks 
      JOIN users ON tasks.user_id = users.id 
      WHERE tasks.tenant_id = ? AND tasks.is_blocked = 1
    `).all(tenantId);
    res.json(alerts);
  });

  app.get("/api/velocity/:tenantId", (req, res) => {
    const { tenantId } = req.params;
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM tasks 
      WHERE tenant_id = ? AND created_at = DATE('now')
    `).get(tenantId) as { total: number, completed: number };
    
    const velocity = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    res.json({ velocity, total: stats.total, completed: stats.completed });
  });

  app.get("/api/custom-widgets/:tenantId", (req, res) => {
    const { tenantId } = req.params;
    const widgets = db.prepare("SELECT * FROM custom_widgets WHERE tenant_id = ?").all(tenantId);
    res.json(widgets);
  });

  app.post("/api/custom-widgets", (req, res) => {
    const { tenantId, userId, label, type, goalValue, config } = req.body;
    const insert = db.prepare("INSERT INTO custom_widgets (tenant_id, user_id, label, type, goal_value, config) VALUES (?, ?, ?, ?, ?, ?)");
    const info = insert.run(tenantId, userId, label, type, goalValue || null, JSON.stringify(config || {}));
    const widget = db.prepare("SELECT * FROM custom_widgets WHERE id = ?").get(info.lastInsertRowid);
    res.json(widget);
  });

  app.put("/api/custom-widgets/:id", (req, res) => {
    const { id } = req.params;
    const { currentValue, goalValue, label, type } = req.body;
    if (currentValue !== undefined) {
      db.prepare("UPDATE custom_widgets SET current_value = ? WHERE id = ?").run(currentValue, id);
    }
    if (goalValue !== undefined) {
      db.prepare("UPDATE custom_widgets SET goal_value = ? WHERE id = ?").run(goalValue, id);
    }
    if (label !== undefined) {
      db.prepare("UPDATE custom_widgets SET label = ? WHERE id = ?").run(label, id);
    }
    if (type !== undefined) {
      db.prepare("UPDATE custom_widgets SET type = ? WHERE id = ?").run(type, id);
    }
    res.json({ success: true });
  });

  app.delete("/api/custom-widgets/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM custom_widgets WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.patch("/api/tenants/:id/overrides", (req, res) => {
    const { id } = req.params;
    const updates = req.body; // partial override object to merge
    const tenant = db.prepare("SELECT custom_labels FROM tenants WHERE id = ?").get(id) as any;
    const existing = tenant?.custom_labels ? JSON.parse(tenant.custom_labels) : {};
    const merged = { ...existing, ...updates };
    db.prepare("UPDATE tenants SET custom_labels = ? WHERE id = ?").run(JSON.stringify(merged), id);
    res.json({ success: true });
  });

  app.get("/api/tenants/:id/api-keys", (req, res) => {
    const { id } = req.params;
    const keys = db.prepare("SELECT id, prefix, name, created_at FROM api_keys WHERE tenant_id = ?").all(id);
    res.json(keys);
  });

  app.post("/api/tenants/:id/api-keys", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    // Generate secure key
    const rawKey = 'ghm_live_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.substring(0, 13) + '...';

    const insert = db.prepare("INSERT INTO api_keys (tenant_id, key_hash, prefix, name) VALUES (?, ?, ?, ?)");
    const info = insert.run(id, hash, prefix, name || 'Unnamed API Key');
    
    // Only return rawKey precisely once!
    res.json({ id: info.lastInsertRowid, rawKey, prefix, name: name || 'Unnamed API Key' });
  });

  app.delete("/api/api-keys/:keyId", (req, res) => {
    const { keyId } = req.params;
    db.prepare("DELETE FROM api_keys WHERE id = ?").run(keyId);
    res.json({ success: true });
  });

  // Native Documents Workflow
  app.post("/api/documents/:tenantId", upload.single('file'), (req, res) => {
    const { tenantId } = req.params;
    const { userId } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const url = `/uploads/${file.filename}`;
    const ext = file.originalname.split('.').pop() || 'file';

    const insert = db.prepare("INSERT INTO documents (tenant_id, uploaded_by, name, type, url, size) VALUES (?, ?, ?, ?, ?, ?)");
    insert.run(tenantId, userId, file.originalname, ext, url, file.size);
    res.json({ success: true, url });
  });

  app.delete("/api/documents/:documentId", (req, res) => {
    const { documentId } = req.params;
    const authorId = req.query.authorId;
    
    // Optional: Wipe physical file to save space natively
    const doc = db.prepare("SELECT url FROM documents WHERE id = ? AND uploaded_by = ?").get(Number(documentId), Number(authorId));
    if (doc) {
      try {
        const filePath = path.join(__dirname, doc.url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {
        console.error("Failed to delete physical file", e);
      }
    }

    const result = db.prepare("DELETE FROM documents WHERE id = ? AND uploaded_by = ?").run(Number(documentId), Number(authorId));
    if (result.changes === 0) return res.status(403).json({ error: "Unauthorized or not found" });
    res.json({ success: true });
  });

  // Social Workflow
  app.post("/api/social", (req, res) => {
    const { tenantId, authorId, content } = req.body;
    const insert = db.prepare("INSERT INTO social_posts (tenant_id, author_id, content) VALUES (?, ?, ?)");
    insert.run(tenantId, authorId, content);
    res.json({ success: true });
  });

  app.post("/api/social/:postId/like", (req, res) => {
    const { postId } = req.params;
    db.prepare("UPDATE social_posts SET likes = likes + 1 WHERE id = ?").run(Number(postId));
    res.json({ success: true });
  });

  app.put("/api/social/:postId", (req, res) => {
    const { postId } = req.params;
    const { content, authorId } = req.body;
    const result = db.prepare("UPDATE social_posts SET content = ? WHERE id = ? AND author_id = ?")
                   .run(content, Number(postId), Number(authorId));
    if (result.changes === 0) return res.status(403).json({ error: "Unauthorized or not found" });
    res.json({ success: true });
  });

  app.delete("/api/social/:postId", (req, res) => {
    const { postId } = req.params;
    const authorId = req.query.authorId;
    const result = db.prepare("DELETE FROM social_posts WHERE id = ? AND author_id = ?")
                   .run(Number(postId), Number(authorId));
    if (result.changes === 0) return res.status(403).json({ error: "Unauthorized or not found" });
    res.json({ success: true });
  });

  // War Room Workflow
  app.get("/api/war-room/:tenantId", (req, res) => {
    const { tenantId } = req.params;
    const authorId = req.query.authorId;
    const today = new Date().toISOString().split('T')[0];

    const blockers = db.prepare(`
      SELECT blockers.*, users.name as user 
      FROM blockers 
      LEFT JOIN users ON blockers.author_id = users.id 
      WHERE blockers.tenant_id = ?
    `).all(tenantId);

    const myEod = db.prepare(`
      SELECT id FROM eod_reports 
      WHERE tenant_id = ? AND author_id = ? AND date = ?
    `).get(tenantId, authorId ? Number(authorId) : -1, today);

    res.json({ blockers, hasSubmittedEod: !!myEod });
  });

  app.post("/api/blockers", (req, res) => {
    const { tenantId, authorId, task, blocker_text, is_escalated } = req.body;
    const insert = db.prepare("INSERT INTO blockers (tenant_id, author_id, task, blocker_text, is_escalated) VALUES (?, ?, ?, ?, ?)");
    insert.run(tenantId, authorId, task, blocker_text, is_escalated ? 1 : 0);
    res.json({ success: true });
  });

  app.delete("/api/blockers/:id", (req, res) => {
    db.prepare("DELETE FROM blockers WHERE id = ?").run(Number(req.params.id));
    res.json({ success: true });
  });

  app.post("/api/eod", (req, res) => {
    const { tenantId, authorId, report_text } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const insert = db.prepare("INSERT INTO eod_reports (tenant_id, author_id, report_text, date) VALUES (?, ?, ?, ?)");
    insert.run(tenantId, authorId, report_text, today);
    res.json({ success: true });
  });

  // Webhook Ingestion Engine
  app.post("/api/v1/ingest/:widget_id", (req, res) => {
    // 1. Authenticate Request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Bearer token' });
    }
    
    const rawKey = authHeader.split(' ')[1];
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    const tokenRecord = db.prepare("SELECT tenant_id FROM api_keys WHERE key_hash = ?").get(hash) as any;
    if (!tokenRecord) {
      return res.status(403).json({ error: 'Invalid API Key' });
    }
    
    const widgetId = req.params.widget_id;
    const payload = req.body;
    if (typeof payload.value !== 'number') {
      return res.status(400).json({ error: 'Payload must contain a numerical "value"' });
    }

    const widget = db.prepare("SELECT id FROM custom_widgets WHERE id = ? AND tenant_id = ?").get(widgetId, tokenRecord.tenant_id);
    if (!widget) {
      return res.status(404).json({ error: 'Widget not found or access denied' });
    }

    // 2. Respond immediately for highest throughput metrics
    res.status(200).json({ success: true, message: 'Ingested', widgetId });

    // 3. Offload explicit database write logic
    setImmediate(() => {
      try {
        db.prepare("UPDATE custom_widgets SET current_value = ? WHERE id = ?").run(payload.value, widgetId);
        // Dispatch Supabase/Socket.io live hook here!
        console.log(`[Webhook Engine] Widget ${widgetId} received real-time state mutation: ${payload.value}`);
      } catch (err) {
        console.error('Webhook async write failed', err);
      }
    });
  });

  // Public API endpoint with CORS disabled for external embeds
  app.get("/api/public/v1/metrics", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const apiKey = req.query.apiKey;
    if (!apiKey) return res.status(401).json({ error: 'API Key required' });

    const tenant = db.prepare("SELECT * FROM tenants WHERE api_key = ?").get(apiKey) as any;
    if (!tenant) return res.status(403).json({ error: 'Invalid API Key' });

    const users = db.prepare("SELECT * FROM users WHERE tenant_id = ?").all(tenant.id);
    const dailyGoal = db.prepare("SELECT * FROM daily_goals WHERE tenant_id = ? AND date = DATE('now')").get(tenant.id);
    
    // Fetch velocity
    const stats = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed FROM tasks WHERE tenant_id = ? AND created_at = DATE('now')`).get(tenant.id) as any;
    const velocity = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    res.json({
      tenantName: tenant.name,
      metrics: {
        runwayDays: tenant.total_balance && tenant.daily_burn ? Math.floor(tenant.total_balance / tenant.daily_burn) : 0,
        taskVelocity: velocity,
      },
      northStar: dailyGoal ? dailyGoal.goal_text : null,
      teamSize: users.length,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
