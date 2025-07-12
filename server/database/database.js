const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

let db;

const initDatabase = async () => {
  const dbPath = path.join(__dirname, '..', '..', 'nft_generator.db');
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      
      // Create tables
      db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        // Projects table
        db.run(`CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          description TEXT,
          folder_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
        
        // Layers table
        db.run(`CREATE TABLE IF NOT EXISTS layers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          name TEXT NOT NULL,
          z_index INTEGER DEFAULT 0,
          rarity_percentage REAL DEFAULT 100.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id)
        )`);
        
        // Assets table
        db.run(`CREATE TABLE IF NOT EXISTS assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          layer_id INTEGER,
          filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          rarity_weight REAL DEFAULT 1.0,
          position_x REAL DEFAULT 0,
          position_y REAL DEFAULT 0,
          scale_x REAL DEFAULT 1.0,
          scale_y REAL DEFAULT 1.0,
          rotation REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (layer_id) REFERENCES layers (id)
        )`);
        
        // Generated NFTs table
        db.run(`CREATE TABLE IF NOT EXISTS generated_nfts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          edition_number INTEGER,
          image_path TEXT,
          metadata_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id)
        )`);
        
        // Project settings table
        db.run(`CREATE TABLE IF NOT EXISTS project_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER UNIQUE,
          canvas_width INTEGER DEFAULT 1000,
          canvas_height INTEGER DEFAULT 1000,
          background_color TEXT DEFAULT '#ffffff',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id)
        )`);
        
        // Asset compatibility table
        db.run(`CREATE TABLE IF NOT EXISTS asset_compatibility (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER,
          asset_id INTEGER,
          incompatible_asset_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id),
          FOREIGN KEY (asset_id) REFERENCES assets (id),
          FOREIGN KEY (incompatible_asset_id) REFERENCES assets (id),
          UNIQUE(asset_id, incompatible_asset_id)
        )`);
        
        // Add rarity_percentage column to existing layers table if it doesn't exist
        db.run(`ALTER TABLE layers ADD COLUMN rarity_percentage REAL DEFAULT 100.0`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding rarity_percentage column:', err);
          }
        });
      });
      
      resolve();
    });
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};

const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
};

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
}; 