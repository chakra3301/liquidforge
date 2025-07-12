const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs-extra');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', '..', 'data');
fs.ensureDirSync(dbDir);

const dbPath = path.join(dbDir, 'liquid_forge.db');

let db = null;

function getDb() {
  if (!db) {
    db = new sqlite3.Database(dbPath);
  }
  return db;
}

// Promisify database operations
function promisifyDb(db) {
  return {
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    },
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  };
}

async function initDatabase() {
  const database = getDb();
  const db = promisifyDb(database);

  try {
    // Create users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create projects table
    await db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Create layers table
    await db.run(`
      CREATE TABLE IF NOT EXISTS layers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        order_index INTEGER NOT NULL,
        rarity_percentage REAL DEFAULT 100.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
      )
    `);

    // Create assets table
    await db.run(`
      CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        layer_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        filepath TEXT NOT NULL,
        rarity_percentage REAL DEFAULT 100.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (layer_id) REFERENCES layers (id) ON DELETE CASCADE
      )
    `);

    // Create asset_compatibility table for incompatibility rules
    await db.run(`
      CREATE TABLE IF NOT EXISTS asset_compatibility (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        asset1_id INTEGER NOT NULL,
        asset2_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (asset1_id) REFERENCES assets (id) ON DELETE CASCADE,
        FOREIGN KEY (asset2_id) REFERENCES assets (id) ON DELETE CASCADE,
        UNIQUE(asset1_id, asset2_id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

module.exports = {
  getDb,
  promisifyDb,
  initDatabase
}; 