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
        folder_path TEXT,
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
        z_index INTEGER NOT NULL,
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
        file_path TEXT NOT NULL,
        rarity_weight REAL DEFAULT 1.0,
        position_x REAL DEFAULT 0.0,
        position_y REAL DEFAULT 0.0,
        scale_x REAL DEFAULT 1.0,
        scale_y REAL DEFAULT 1.0,
        rotation REAL DEFAULT 0.0,
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

    // Create project_settings table for canvas configuration
    await db.run(`
      CREATE TABLE IF NOT EXISTS project_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        canvas_width INTEGER DEFAULT 1000,
        canvas_height INTEGER DEFAULT 1000,
        background_color TEXT DEFAULT '#ffffff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        UNIQUE(project_id)
      )
    `);

    // Create generated_nfts table for storing generated NFT data
    await db.run(`
      CREATE TABLE IF NOT EXISTS generated_nfts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        edition_number INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        metadata_path TEXT NOT NULL,
        generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        UNIQUE(project_id, edition_number)
      )
    `);

    // Create demo user if it doesn't exist
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', ['demo@user.com']);
    if (!existingUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('demo123', 10);
      await db.run('INSERT INTO users (email, password) VALUES (?, ?)', ['demo@user.com', hashedPassword]);
      console.log('Demo user created: demo@user.com / demo123');
    }

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