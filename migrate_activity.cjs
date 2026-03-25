const Database = require('better-sqlite3');
const db = new Database('grahamly.db');

try {
  console.log('Starting migration...');
  
  // 1. Add completed_at column to tasks
  db.exec("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;");
  console.log('Added completed_at to tasks.');

  // 2. Update created_at to DATETIME format if it was just DATE
  // In SQLite, CURRENT_TIMESTAMP is DATETIME. 
  // We'll update existing records to have a timestamp.
  db.exec("UPDATE tasks SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NOT NULL;");
  console.log('Updated tasks created_at to DATETIME.');

  // 3. Ensure documents also has a clean DATETIME
  db.exec("UPDATE documents SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NOT NULL;");
  console.log('Updated documents created_at to DATETIME.');

  console.log('Migration completed successfully.');
} catch (err) {
  if (err.message.includes('duplicate column name')) {
    console.log('Column completed_at already exists. Skipping migration.');
  } else {
    console.error('Migration failed:', err.message);
  }
} finally {
  db.close();
}
