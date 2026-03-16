const Database = require('better-sqlite3');
const path = require('path');

// Open the SQLite database file (one level up from backend/)
const dbPath = path.join(__dirname, '..', 'model_portfolio.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// Test query — verify connection works on startup
const clients = db.prepare('SELECT * FROM clients').all();
console.log('✅ Database connected. Clients loaded:', clients.length);
console.log(clients);

module.exports = db;
