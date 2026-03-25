const Database = require('better-sqlite3');
const db = new Database('grahamly.db');

try {
  const tenantId = 10;
  // 1. Create a task
  const taskId = db.prepare('INSERT INTO tasks (tenant_id, title, status) VALUES (?, ?, ?)')
    .run(tenantId, 'Verification Task', 'Planned').lastInsertRowid;
  console.log('Created task:', taskId);

  // 2. Complete the task
  db.prepare("UPDATE tasks SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(taskId);
  console.log('Completed task:', taskId);

  // 3. Upload a document
  db.prepare('INSERT INTO documents (tenant_id, name, type, url, size) VALUES (?, ?, ?, ?, ?)')
    .run(tenantId, 'Verification_Doc.pdf', 'pdf', 'http://example.com', 1000);
  console.log('Uploaded document.');

  // This should result in:
  // Task Created: +2
  // Task Completed: +5
  // Doc Uploaded: +3
  // Total for this minute: 10
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
