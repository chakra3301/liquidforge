const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const multer = require('multer');
const unzipper = require('unzipper');
const bcryptjs = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const uuid = require('uuid');
const fs = require('fs-extra');
const archiver = require('archiver');
const { createCanvas, loadImage } = require('canvas');

// Detect if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === 'true' || 
              !app.isPackaged;

let mainWindow;
let server;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    x: 100,
    y: 100,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'NFT Maker - Liquid Forge'
  });

  // Load the app - always use built files to avoid reload issues
  const startUrl = `file://${path.join(__dirname, '..', 'build', 'index.html')}`;
  
  console.log('Loading URL:', startUrl);
  console.log('Is dev mode:', isDev);
  console.log('App packaged:', app.isPackaged);
  
  mainWindow.loadURL(startUrl).then(() => {
    console.log('URL loaded successfully');
  }).catch((error) => {
    console.error('Error loading URL:', error);
  });

  // Force show and focus
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.setAlwaysOnTop(true);
    mainWindow.setAlwaysOnTop(false);
    mainWindow.center();
    mainWindow.moveTop();
    mainWindow.setVisibleOnAllWorkspaces(true);
    console.log('Main window ready to show');
    
    // Add error handlers
    addWindowErrorHandlers();
    
    // Force show again after a delay to ensure it's visible
    setTimeout(() => {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.moveTop();
      console.log('Forced window show after delay');
    }, 1000);
  });
  mainWindow.on('show', () => {
    console.log('Main window shown');
  });
  mainWindow.on('closed', () => {
    console.log('Main window closed');
    mainWindow = null;
  });
  
  // Add page load event listeners
  mainWindow.webContents.on('did-start-loading', () => {
    console.log('Page started loading');
  });
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Page failed to load:', errorCode, errorDescription, validatedURL);
  });

  // Open DevTools in development (optional)
  // if (isDev) {
  //   mainWindow.webContents.openDevTools();
  // }
}

// Database setup
let db = null;

// Promisify database operations
const promisifyDb = (db) => ({
  get: (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),
  all: (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),
  run: (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  })
});

function initializeDatabase() {
  // Use __dirname in development, process.resourcesPath in production
  const basePath = isDev ? __dirname : (process.resourcesPath || __dirname);
  const dbDir = path.join(basePath, 'data');
  fs.ensureDirSync(dbDir);
  const dbPath = path.join(dbDir, 'liquid_forge.db');
  console.log('Database path:', dbPath);
  db = new sqlite3.Database(dbPath);

  // Initialize database tables
  const initDatabase = async () => {
    const dbPromisified = promisifyDb(db);
    
    try {
      await dbPromisified.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await dbPromisified.run(`
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

      await dbPromisified.run(`
        CREATE TABLE IF NOT EXISTS layers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          z_index INTEGER DEFAULT 0,
          rarity_percentage REAL DEFAULT 100.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )
      `);

      await dbPromisified.run(`
        CREATE TABLE IF NOT EXISTS assets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          layer_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER,
          rarity_weight REAL DEFAULT 1.0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (layer_id) REFERENCES layers (id) ON DELETE CASCADE
        )
      `);

      // Create demo user if it doesn't exist
      const existingUser = await dbPromisified.get('SELECT * FROM users WHERE email = ?', ['demo@user.com']);
      if (!existingUser) {
        const hashedPassword = await bcryptjs.hash('demo123', 10);
        await dbPromisified.run('INSERT INTO users (email, password) VALUES (?, ?)', ['demo@user.com', hashedPassword]);
        console.log('Demo user created: demo@user.com / demo123');
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  };

  initDatabase();
}

// Helper function to scan extracted ZIP and create layers/assets
async function processExtractedProject(extractPath, projectId, dbPromisified) {
  try {
    console.log('Processing extracted project at:', extractPath);
    
    // Get all directories in the extracted path (each directory = a layer)
    const items = await fs.readdir(extractPath);
    const layerDirectories = [];
    
    for (const item of items) {
      const itemPath = path.join(extractPath, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        layerDirectories.push(item);
      }
    }
    
    console.log('Found layer directories:', layerDirectories);
    
    // Process each layer directory
    for (let i = 0; i < layerDirectories.length; i++) {
      const layerName = layerDirectories[i];
      const layerPath = path.join(extractPath, layerName);
      
      // Create layer record
      const layerResult = await dbPromisified.run(`
        INSERT INTO layers (project_id, name, z_index, rarity_percentage, created_at) 
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [projectId, layerName, i, 100.0]);
      
      const layerId = layerResult.lastID;
      console.log(`Created layer: ${layerName} with ID: ${layerId}`);
      
      // Get all image files in the layer directory
      const layerItems = await fs.readdir(layerPath);
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'];
      
      for (const fileItem of layerItems) {
        const filePath = path.join(layerPath, fileItem);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const ext = path.extname(fileItem).toLowerCase();
          if (imageExtensions.includes(ext)) {
            // Create asset record
            const relativePath = path.relative(extractPath, filePath);
            await dbPromisified.run(`
              INSERT INTO assets (layer_id, filename, file_path, file_size, rarity_weight, created_at) 
              VALUES (?, ?, ?, ?, ?, datetime('now'))
            `, [layerId, fileItem, relativePath, stats.size, 1.0]);
            
            console.log(`Added asset: ${fileItem} to layer: ${layerName}`);
          }
        }
      }
    }
    
    return {
      layersCreated: layerDirectories.length,
      totalAssets: await getTotalAssetsForProject(projectId, dbPromisified)
    };
  } catch (error) {
    console.error('Error processing extracted project:', error);
    throw error;
  }
}

// Helper function to get total assets for a project
async function getTotalAssetsForProject(projectId, dbPromisified) {
  const result = await dbPromisified.get(`
    SELECT COUNT(*) as count 
    FROM assets a 
    JOIN layers l ON a.layer_id = l.id 
    WHERE l.project_id = ?
  `, [projectId]);
  return result.count;
}

// IPC Handlers
ipcMain.handle('api-health', async () => {
  return { status: 'ok', message: 'API is running' };
});

ipcMain.handle('api-upload', async (event, formData) => {
  try {
    const { file, projectName, description } = formData;
    
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!db) {
      throw new Error('Database not initialized');
    }

    const basePath = isDev ? __dirname : (process.resourcesPath || __dirname);
    const uploadsDir = path.join(basePath, 'uploads');
    fs.ensureDirSync(uploadsDir);
    
    const fileName = `${Date.now()}-${uuid.v4()}-${file.name}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Save the file
    await fs.writeFile(filePath, Buffer.from(file.data));
    
    const extractPath = path.join(basePath, 'extracted', uuid.v4());
    await fs.ensureDir(extractPath);

    // Extract zip file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .on('close', resolve)
        .on('error', reject);
    });

    // Save project to database
    const dbPromisified = promisifyDb(db);
    const demoUserId = 1; // Demo user ID
    
    const result = await dbPromisified.run(`
      INSERT INTO projects (user_id, name, description, folder_path, created_at) 
      VALUES (?, ?, ?, ?, datetime('now'))
    `, [demoUserId, projectName || 'Untitled Project', description || '', extractPath]);

    const projectId = result.lastID;
    console.log(`Created project with ID: ${projectId}`);

    // Process the extracted ZIP to create layers and assets
    const processingResult = await processExtractedProject(extractPath, projectId, dbPromisified);

    return { 
      message: `Project uploaded successfully! Created ${processingResult.layersCreated} layers with ${processingResult.totalAssets} assets.`,
      projectName: projectName || 'Untitled Project',
      extractPath,
      projectId: projectId,
      layersCreated: processingResult.layersCreated,
      totalAssets: processingResult.totalAssets
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Upload failed: ' + error.message);
  }
});

ipcMain.handle('api-auth-login', async (event, credentials) => {
  try {
    const { email, password } = credentials;
    const dbPromisified = promisifyDb(db);

    const user = await dbPromisified.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const JWT_SECRET = 'your-secret-key';
    const token = jsonwebtoken.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    return {
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Login failed: ' + error.message);
  }
});

ipcMain.handle('api-projects', async () => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    const projects = await dbPromisified.all(`
      SELECT 
        p.*,
        COUNT(DISTINCT l.id) as layer_count,
        COUNT(DISTINCT a.id) as asset_count
      FROM projects p
      LEFT JOIN layers l ON p.id = l.project_id
      LEFT JOIN assets a ON l.id = a.layer_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    
    // If no projects exist, create some sample projects
    if (projects.length === 0) {
      const demoUserId = 1; // Demo user ID
      
      await dbPromisified.run(`
        INSERT INTO projects (user_id, name, description, folder_path, created_at) 
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [demoUserId, 'Sample NFT Collection', 'A sample NFT collection with cyberpunk theme', '/sample/path']);
      
      await dbPromisified.run(`
        INSERT INTO projects (user_id, name, description, folder_path, created_at) 
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [demoUserId, 'Pixel Art Characters', 'Collection of pixel art character NFTs', '/pixel/path']);
      
      // Fetch the projects again after creating sample data
      const updatedProjects = await dbPromisified.all(`
        SELECT 
          p.*,
          COUNT(DISTINCT l.id) as layer_count,
          COUNT(DISTINCT a.id) as asset_count
        FROM projects p
        LEFT JOIN layers l ON p.id = l.project_id
        LEFT JOIN assets a ON l.id = a.layer_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `);
      return { projects: updatedProjects };
    }
    
    return { projects };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to load projects: ' + error.message);
  }
});

// Layer management IPC handlers
ipcMain.handle('api-layers-assets', async (event, { projectId, layerId }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    const assets = await dbPromisified.all(`
      SELECT * FROM assets 
      WHERE layer_id = ? 
      ORDER BY filename ASC
    `, [layerId]);
    
    return { assets };
  } catch (error) {
    console.error('Error fetching layer assets:', error);
    throw new Error('Failed to load layer assets: ' + error.message);
  }
});

ipcMain.handle('api-layers-order', async (event, { projectId, layers }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const dbPromisified = promisifyDb(db);
    // Update z_index for each layer
    for (const layer of layers) {
      await dbPromisified.run(
        'UPDATE layers SET z_index = ? WHERE id = ? AND project_id = ?',
        [layer.z_index, layer.id, projectId]
      );
    }
    return { message: 'Layer order updated successfully' };
  } catch (error) {
    console.error('Error updating layer order:', error);
    throw new Error('Failed to update layer order');
  }
});

ipcMain.handle('api-layers-rarity', async (event, { projectId, layerId, rarityPercentage }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const dbPromisified = promisifyDb(db);
    await dbPromisified.run(
      'UPDATE layers SET rarity_percentage = ? WHERE id = ? AND project_id = ?',
      [rarityPercentage, layerId, projectId]
    );
    return { message: 'Layer rarity updated successfully' };
  } catch (error) {
    console.error('Error updating layer rarity:', error);
    throw new Error('Failed to update layer rarity');
  }
});

ipcMain.handle('api-layers-delete', async (event, { projectId, layerId }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    const dbPromisified = promisifyDb(db);
    // Delete all assets in the layer first (to maintain referential integrity)
    await dbPromisified.run('DELETE FROM assets WHERE layer_id = ?', [layerId]);
    // Delete the layer itself
    await dbPromisified.run('DELETE FROM layers WHERE id = ? AND project_id = ?', [layerId, projectId]);
    return { message: 'Layer deleted successfully' };
  } catch (error) {
    console.error('Error deleting layer:', error);
    throw new Error('Failed to delete layer');
  }
});

// Project deletion handler
ipcMain.handle('api-projects-delete', async (event, { projectId }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    await dbPromisified.run('DELETE FROM projects WHERE id = ?', [projectId]);
    
    return { message: 'Project deleted successfully' };
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project: ' + error.message);
  }
});

// NFT Generation IPC handlers
ipcMain.handle('api-generate-status', async (event, { projectId }) => {
  try {
    // TODO: Implement generation status fetching
    return { status: 'idle', generated: 0, total: 0 };
  } catch (error) {
    console.error('Error fetching generation status:', error);
    return { status: 'error', generated: 0, total: 0, error: error.message };
  }
});

ipcMain.handle('api-generate-preview', async (event, { projectId, count }) => {
  try {
    if (!db) {
      console.error('Database not initialized for preview generation');
      return { nfts: [], error: 'Database not initialized' };
    }

    const dbPromisified = promisifyDb(db);
    
    // Get project details
    const project = await dbPromisified.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      throw new Error('Project not found');
    }

    // Get all layers with their assets
    const layers = await dbPromisified.all(`
      SELECT 
        l.id,
        l.name,
        l.z_index,
        l.rarity_percentage
      FROM layers l
      WHERE l.project_id = ?
      ORDER BY l.z_index ASC
    `, [projectId]);

    // Get assets for each layer
    for (let layer of layers) {
      const assets = await dbPromisified.all(`
        SELECT 
          a.id,
          a.filename,
          a.file_path,
          a.rarity_weight
        FROM assets a
        WHERE a.layer_id = ?
        ORDER BY a.filename ASC
      `, [layer.id]);
      
      layer.assets = assets;
    }

    const previewNFTs = [];
    const previewCount = count || 5;

    console.log(`Generating ${previewCount} preview NFTs for project: ${project.name}`);

    for (let i = 0; i < previewCount; i++) {
      const nftId = i + 1;
      const nftName = `Preview #${nftId}`;
      
      // Create canvas
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext('2d');

      // Set background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1000, 1000);

      const selectedAssets = [];
      let hasValidLayers = false;

      // For each layer, randomly select an asset based on rarity
      for (const layer of layers) {
        if (layer.assets.length === 0) continue;

        // Check layer rarity percentage
        const rarityCheck = Math.random() * 100;
        if (rarityCheck > (layer.rarity_percentage || 100)) {
          continue; // Skip this layer based on rarity
        }

        // Calculate total weight for this layer
        const totalWeight = layer.assets.reduce((sum, asset) => sum + (asset.rarity_weight || 1), 0);
        
        // Select asset based on weight
        let randomWeight = Math.random() * totalWeight;
        let selectedAsset = null;
        
        for (const asset of layer.assets) {
          randomWeight -= (asset.rarity_weight || 1);
          if (randomWeight <= 0) {
            selectedAsset = asset;
            break;
          }
        }

        if (selectedAsset) {
          selectedAssets.push({
            layer: layer.name,
            asset: selectedAsset
          });
          hasValidLayers = true;
        }
      }

      if (!hasValidLayers) {
        console.log(`Preview NFT ${nftId}: No valid layers selected, skipping`);
        continue;
      }

      // Composite the selected assets
      for (const { asset } of selectedAssets) {
        try {
          const imagePath = path.join(project.folder_path, asset.file_path);
          
          if (await fs.pathExists(imagePath)) {
            const image = await loadImage(imagePath);
            
            // Calculate position to center the image
            const x = (1000 - image.width) / 2;
            const y = (1000 - image.height) / 2;
            
            ctx.drawImage(image, x, y);
          }
        } catch (error) {
          console.error(`Error loading image for asset ${asset.filename}:`, error);
        }
      }

      // Save the generated image
      const imageBuffer = canvas.toBuffer('image/png');
      const imageFileName = `preview_${nftId.toString().padStart(4, '0')}.png`;
      
      // Create output directory for previews
      const basePath = isDev ? __dirname : (process.resourcesPath || __dirname);
      const previewDir = path.join(basePath, 'generated', projectId.toString(), 'previews');
      await fs.ensureDir(previewDir);
      
      const imagePath = path.join(previewDir, imageFileName);
      await fs.writeFile(imagePath, imageBuffer);

      previewNFTs.push({
        id: nftId,
        name: nftName,
        image: imageFileName,
        attributes: selectedAssets.map(({ layer, asset }) => ({
          trait_type: layer,
          value: asset.filename.replace(/\.[^/.]+$/, '') // Remove file extension
        }))
      });

      console.log(`Generated preview NFT ${nftId}: ${nftName}`);
    }

    console.log(`Successfully generated ${previewNFTs.length} preview NFTs`);

    return { nfts: previewNFTs };
  } catch (error) {
    console.error('Error generating preview:', error);
    throw new Error('Failed to generate preview: ' + error.message);
  }
});

ipcMain.handle('api-generate', async (event, { projectId, config }) => {
  try {
    if (!db) {
      console.error('Database not initialized for generation');
      return { nfts: [], error: 'Database not initialized' };
    }

    const dbPromisified = promisifyDb(db);
    
    // Get project details
    const project = await dbPromisified.get('SELECT * FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      throw new Error('Project not found');
    }

    // Get all layers with their assets
    const layers = await dbPromisified.all(`
      SELECT 
        l.id,
        l.name,
        l.z_index,
        l.rarity_percentage
      FROM layers l
      WHERE l.project_id = ?
      ORDER BY l.z_index ASC
    `, [projectId]);

    // Get assets for each layer
    for (let layer of layers) {
      const assets = await dbPromisified.all(`
        SELECT 
          a.id,
          a.filename,
          a.file_path,
          a.rarity_weight
        FROM assets a
        WHERE a.layer_id = ?
        ORDER BY a.filename ASC
      `, [layer.id]);
      
      layer.assets = assets;
    }

    // Create output directory
    const basePath = isDev ? __dirname : (process.resourcesPath || __dirname);
    const outputDir = path.join(basePath, 'generated', projectId.toString());
    await fs.ensureDir(outputDir);
    await fs.ensureDir(path.join(outputDir, 'images'));
    await fs.ensureDir(path.join(outputDir, 'metadata'));

    const generatedNFTs = [];
    const count = config.count || 100;

    console.log(`Generating ${count} NFTs for project: ${project.name}`);
    console.log(`Project folder path: ${project.folder_path}`);
    console.log(`Available layers: ${layers.length}`);
    layers.forEach(layer => {
      console.log(`Layer: ${layer.name}, Assets: ${layer.assets.length}`);
    });

    for (let i = 0; i < count; i++) {
      const nftId = i + 1;
      const nftName = `${config.collectionName} #${nftId}`;
      
      // Create canvas (assuming 1000x1000, you can make this configurable)
      const canvas = createCanvas(1000, 1000);
      const ctx = canvas.getContext('2d');

      // Set background (you can make this configurable)
      ctx.fillStyle = config.backgroundColor || '#000000';
      ctx.fillRect(0, 0, 1000, 1000);

      const selectedAssets = [];
      let hasValidLayers = false;

      // For each layer, randomly select an asset based on rarity
      for (const layer of layers) {
        if (layer.assets.length === 0) continue;

        // Check layer rarity percentage
        const rarityCheck = Math.random() * 100;
        if (rarityCheck > (layer.rarity_percentage || 100)) {
          continue; // Skip this layer based on rarity
        }

        // Calculate total weight for this layer
        const totalWeight = layer.assets.reduce((sum, asset) => sum + (asset.rarity_weight || 1), 0);
        
        // Select asset based on weight
        let randomWeight = Math.random() * totalWeight;
        let selectedAsset = null;
        
        for (const asset of layer.assets) {
          randomWeight -= (asset.rarity_weight || 1);
          if (randomWeight <= 0) {
            selectedAsset = asset;
            break;
          }
        }

        if (selectedAsset) {
          selectedAssets.push({
            layer: layer.name,
            asset: selectedAsset
          });
          hasValidLayers = true;
        }
      }

      if (!hasValidLayers) {
        console.log(`NFT ${nftId}: No valid layers selected, skipping`);
        continue;
      }

      console.log(`NFT ${nftId}: Selected ${selectedAssets.length} assets`);
      selectedAssets.forEach(({ layer, asset }) => {
        console.log(`  - Layer: ${layer}, Asset: ${asset.filename}`);
      });

      // Composite the selected assets
      for (const { asset } of selectedAssets) {
        try {
          // The asset.file_path is relative to the extracted directory
          const imagePath = path.join(project.folder_path, asset.file_path);
          
          if (await fs.pathExists(imagePath)) {
            const image = await loadImage(imagePath);
            
            // Calculate position to center the image
            const x = (1000 - image.width) / 2;
            const y = (1000 - image.height) / 2;
            
            ctx.drawImage(image, x, y);
          } else {
            console.error(`Image file not found: ${imagePath}`);
          }
        } catch (error) {
          console.error(`Error loading image for asset ${asset.filename}:`, error);
        }
      }

      // Save the generated image
      const imageBuffer = canvas.toBuffer('image/png');
      const imageFileName = `${nftId.toString().padStart(4, '0')}.png`;
      const imagePath = path.join(outputDir, 'images', imageFileName);
      await fs.writeFile(imagePath, imageBuffer);

      // Create metadata
      const metadata = {
        name: nftName,
        description: config.description || 'Generated NFT',
        image: `${config.baseUrl || 'http://localhost:5000'}/images/${imageFileName}`,
        attributes: selectedAssets.map(({ layer, asset }) => ({
          trait_type: layer,
          value: asset.filename.replace(/\.[^/.]+$/, '') // Remove file extension
        }))
      };

      // Save metadata
      const metadataFileName = `${nftId.toString().padStart(4, '0')}.json`;
      const metadataPath = path.join(outputDir, 'metadata', metadataFileName);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      generatedNFTs.push({
        id: nftId,
        name: nftName,
        image: imageFileName,
        metadata: metadataFileName,
        attributes: metadata.attributes
      });

      console.log(`Generated NFT ${nftId}: ${nftName}`);
    }

    console.log(`Successfully generated ${generatedNFTs.length} NFTs`);

    return { 
      nfts: generatedNFTs,
      totalGenerated: generatedNFTs.length,
      outputPath: outputDir
    };
  } catch (error) {
    console.error('Error generating NFTs:', error);
    throw new Error('Failed to generate NFTs: ' + error.message);
  }
});

ipcMain.handle('api-download', async (event, { projectId, type }) => {
  try {
    // TODO: Implement download functionality
    return { success: true };
  } catch (error) {
    console.error('Error downloading:', error);
    throw new Error('Failed to download');
  }
});

// Rarity management IPC handlers
ipcMain.handle('api-rarity', async (event, { projectId }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    
    // Get all layers with their assets for the project
    const layers = await dbPromisified.all(`
      SELECT 
        l.id,
        l.name,
        l.z_index,
        l.rarity_percentage
      FROM layers l
      WHERE l.project_id = ?
      ORDER BY l.z_index ASC
    `, [projectId]);
    
    // For each layer, get its assets
    for (let layer of layers) {
      const assets = await dbPromisified.all(`
        SELECT 
          a.id,
          a.filename,
          a.file_path,
          a.file_size,
          a.rarity_weight
        FROM assets a
        WHERE a.layer_id = ?
        ORDER BY a.filename ASC
      `, [layer.id]);
      
      layer.assets = assets;
    }
    
    return { layers };
  } catch (error) {
    console.error('Error fetching rarity:', error);
    throw new Error('Failed to fetch rarity: ' + error.message);
  }
});

ipcMain.handle('api-rarity-stats', async (event, { projectId }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    
    // Get statistics for each layer
    const stats = await dbPromisified.all(`
      SELECT 
        l.name as layer_name,
        COUNT(a.id) as total_assets,
        AVG(a.rarity_weight) as avg_weight,
        MIN(a.rarity_weight) as min_weight,
        MAX(a.rarity_weight) as max_weight
      FROM layers l
      LEFT JOIN assets a ON l.id = a.layer_id
      WHERE l.project_id = ?
      GROUP BY l.id, l.name
      ORDER BY l.z_index ASC
    `, [projectId]);
    
    return { stats };
  } catch (error) {
    console.error('Error fetching rarity stats:', error);
    throw new Error('Failed to fetch rarity stats: ' + error.message);
  }
});

ipcMain.handle('api-rarity-update', async (event, { projectId, rarity }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    
    // Update rarity weights for each asset
    for (const asset of rarity.assets) {
      await dbPromisified.run(`
        UPDATE assets 
        SET rarity_weight = ? 
        WHERE id = ?
      `, [asset.rarity_weight, asset.id]);
    }
    
    return { message: 'Rarity updated successfully' };
  } catch (error) {
    console.error('Error updating rarity:', error);
    throw new Error('Failed to update rarity: ' + error.message);
  }
});

// Asset viewing IPC handlers
ipcMain.handle('api-layers-compatibility', async (event, { projectId }) => {
  try {
    // TODO: Implement compatibility fetching
    return { compatibility: [] };
  } catch (error) {
    console.error('Error fetching compatibility:', error);
    throw new Error('Failed to fetch compatibility');
  }
});

// Asset image serving handler
ipcMain.handle('api-asset-image', async (event, { projectId, assetPath }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    const project = await dbPromisified.get('SELECT folder_path FROM projects WHERE id = ?', [projectId]);
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const fullImagePath = path.join(project.folder_path, assetPath);
    
    // Check if file exists
    if (!await fs.pathExists(fullImagePath)) {
      throw new Error('Image file not found');
    }
    
    // Read the image file and return as base64
    const imageBuffer = await fs.readFile(fullImagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(assetPath).toLowerCase();
    const mimeType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp'
    }[ext] || 'image/png';
    
    return {
      data: `data:${mimeType};base64,${base64Image}`,
      mimeType
    };
  } catch (error) {
    console.error('Error serving asset image:', error);
    throw new Error('Failed to load image: ' + error.message);
  }
});

// Generated NFT image serving handler
ipcMain.handle('api-generated-image', async (event, { projectId, imageFileName }) => {
  try {
    const basePath = isDev ? __dirname : (process.resourcesPath || __dirname);
    
    // Check if it's a preview image
    let fullImagePath;
    if (imageFileName.startsWith('preview_')) {
      fullImagePath = path.join(basePath, 'generated', projectId.toString(), 'previews', imageFileName);
    } else {
      fullImagePath = path.join(basePath, 'generated', projectId.toString(), 'images', imageFileName);
    }
    
    // Check if file exists
    if (!await fs.pathExists(fullImagePath)) {
      throw new Error('Generated image file not found');
    }
    
    // Read the image file and return as base64
    const imageBuffer = await fs.readFile(fullImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    return {
      data: `data:image/png;base64,${base64Image}`,
      mimeType: 'image/png'
    };
  } catch (error) {
    console.error('Error serving generated image:', error);
    throw new Error('Failed to load generated image: ' + error.message);
  }
});

ipcMain.handle('api-layers-compatibility-add', async (event, { projectId, rule }) => {
  try {
    // TODO: Implement compatibility rule addition
    return { message: 'Compatibility rule added successfully' };
  } catch (error) {
    console.error('Error adding compatibility rule:', error);
    throw new Error('Failed to add compatibility rule');
  }
});

ipcMain.handle('api-layers-compatibility-delete', async (event, { projectId, ruleId }) => {
  try {
    // TODO: Implement compatibility rule deletion
    return { message: 'Compatibility rule deleted successfully' };
  } catch (error) {
    console.error('Error deleting compatibility rule:', error);
    throw new Error('Failed to delete compatibility rule');
  }
});

// Project editing IPC handlers
ipcMain.handle('api-layers', async (event, { projectId }) => {
  try {
    if (!db) {
      throw new Error('Database not initialized');
    }
    
    const dbPromisified = promisifyDb(db);
    const layers = await dbPromisified.all(`
      SELECT * FROM layers 
      WHERE project_id = ? 
      ORDER BY z_index ASC
    `, [projectId]);
    
    return { layers };
  } catch (error) {
    console.error('Error fetching layers:', error);
    throw new Error('Failed to fetch layers: ' + error.message);
  }
});

ipcMain.handle('api-download-stats', async (event, { projectId }) => {
  try {
    // TODO: Implement download stats fetching
    return { stats: {} };
  } catch (error) {
    console.error('Error fetching download stats:', error);
    throw new Error('Failed to fetch download stats');
  }
});

// Canvas editing IPC handlers
ipcMain.handle('api-layers-settings', async (event, { projectId }) => {
  try {
    // TODO: Implement layers settings fetching
    return { settings: {} };
  } catch (error) {
    console.error('Error fetching layers settings:', error);
    throw new Error('Failed to fetch layers settings');
  }
});

ipcMain.handle('api-layers-settings-update', async (event, { projectId, settings }) => {
  try {
    // TODO: Implement layers settings update
    return { message: 'Settings updated successfully' };
  } catch (error) {
    console.error('Error updating layers settings:', error);
    throw new Error('Failed to update settings');
  }
});

// App event handlers
app.whenReady().then(() => {
  initializeDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'ZIP Files', extensions: ['zip'] }
    ]
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showSelectFolderDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Create application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'New Project',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          mainWindow.webContents.send('new-project');
        }
      },
      {
        label: 'Open Project',
        accelerator: 'CmdOrCtrl+O',
        click: async () => {
          const filePath = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
              { name: 'ZIP Files', extensions: ['zip'] }
            ]
          });
          
          if (!filePath.canceled && filePath.filePaths.length > 0) {
            mainWindow.webContents.send('open-project', filePath.filePaths[0]);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  });
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu); 

// Enhanced error handling to prevent crashes and reloads
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});



// Add error handling to prevent window reloads
function addWindowErrorHandlers() {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.on('crashed', (event, killed) => {
      console.error('Renderer process crashed:', { killed });
      // Don't reload, just log the error
    });

    mainWindow.webContents.on('unresponsive', () => {
      console.error('Renderer process became unresponsive');
      // Don't reload, just log the error
    });

    mainWindow.webContents.on('responsive', () => {
      console.log('Renderer process became responsive again');
    });
  }
} 