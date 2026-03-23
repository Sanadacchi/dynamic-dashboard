const Database = require('better-sqlite3');
const db = new Database('./grahamly.db');
console.log("================ NORTH STARS ================");
console.log(db.prepare("SELECT * FROM north_stars").all());
console.log("================ TENANTS ================");
console.log(db.prepare("SELECT * FROM tenants LIMIT 2").all());
