const Database = require('better-sqlite3');
const db = new Database('grahamly.db');

try {
  console.log('Migrating activity_log...');
  db.exec(`
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
  console.log('activity_log table created successfully.');
} catch (err) {
  console.error('Migration failed:', err.message);
} finally {
  db.close();
}
