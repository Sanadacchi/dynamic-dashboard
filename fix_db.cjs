const Database = require('better-sqlite3');
const db = new Database('grahamly.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS north_stars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id INTEGER UNIQUE,
    title TEXT,
    description TEXT,
    milestones TEXT DEFAULT '[]',
    FOREIGN KEY(tenant_id) REFERENCES tenants(id)
  );
`);
console.log("Created north_stars table successfully.");
console.log("Tables:", db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
