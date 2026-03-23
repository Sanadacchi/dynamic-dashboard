const Database = require('better-sqlite3');
const db = new Database('grahamly.db');
console.log("================ TENANTS TABLE ================");
console.log(JSON.stringify(db.prepare("SELECT id, name FROM tenants").all(), null, 2));
console.log("================ NORTH STARS TABLE ================");
console.log(JSON.stringify(db.prepare("SELECT * FROM north_stars").all(), null, 2));
console.log("================ CUSTOM WIDGETS ================");
console.log(JSON.stringify(db.prepare("SELECT * FROM custom_widgets LIMIT 2").all(), null, 2));
