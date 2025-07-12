const express = require('express');
const multer = require('multer');
const unzipper = require('unzipper');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Upload and extract zip file
router.post('/', authenticateToken, upload.single('zipFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectName, description } = req.body;
    const userId = req.user.userId;
    const zipPath = req.file.path;
    const extractPath = path.join(__dirname, '..', '..', 'extracted', uuidv4());

    // Create extraction directory
    await fs.ensureDir(extractPath);

    // Extract zip file
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .on('close', resolve)
        .on('error', reject);
    });

    // Read folder structure
    const layers = [];
    const items = await fs.readdir(extractPath);
    
    console.log('Extracted items:', items);
    
    // Filter out system files and folders
    const systemFiles = ['.DS_Store', '__MACOSX', 'Thumbs.db', '.git', '.gitignore'];
    const filteredItems = items.filter(item => !systemFiles.includes(item));
    
    console.log('Filtered items:', filteredItems);
    
    // Check if we have a single folder that might contain the layers
    let searchPath = extractPath;
    if (filteredItems.length === 1) {
      const singleItem = filteredItems[0];
      const singleItemPath = path.join(extractPath, singleItem);
      const singleItemStats = await fs.stat(singleItemPath);
      
      if (singleItemStats.isDirectory()) {
        console.log(`Found single directory: ${singleItem}, checking inside for layers`);
        searchPath = singleItemPath;
        const subItems = await fs.readdir(searchPath);
        const filteredSubItems = subItems.filter(item => !systemFiles.includes(item));
        console.log(`Sub-items in ${singleItem}:`, filteredSubItems);
        
        // Use sub-items as potential layers
        for (const subItem of filteredSubItems) {
          const subItemPath = path.join(searchPath, subItem);
          const subItemStats = await fs.stat(subItemPath);
          
          if (subItemStats.isDirectory()) {
            const layerName = subItem;
            const assets = [];
            
            // Read assets in layer
            const assetFiles = await fs.readdir(subItemPath);
            const filteredAssetFiles = assetFiles.filter(file => !systemFiles.includes(file));
            console.log(`Layer ${layerName} files:`, filteredAssetFiles);
            
            for (const assetFile of filteredAssetFiles) {
              const assetPath = path.join(subItemPath, assetFile);
              const assetStats = await fs.stat(assetPath);
              
              if (assetStats.isFile()) {
                const ext = path.extname(assetFile).toLowerCase();
                console.log(`Asset: ${assetFile}, extension: ${ext}`);
                if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
                  assets.push({
                    filename: assetFile,
                    filePath: assetPath,
                    relativePath: path.join(layerName, assetFile)
                  });
                }
              }
            }
            
            console.log(`Layer ${layerName} valid assets:`, assets.length);
            
            if (assets.length > 0) {
              layers.push({
                name: layerName,
                assets
              });
            }
          }
        }
      }
    } else {
      // Original logic for multiple items at root
      for (const item of filteredItems) {
        const itemPath = path.join(extractPath, item);
        const stats = await fs.stat(itemPath);
        
        console.log(`Item: ${item}, isDirectory: ${stats.isDirectory()}`);
        
        if (stats.isDirectory()) {
          const layerName = item;
          const assets = [];
          
          // Read assets in layer
          const assetFiles = await fs.readdir(itemPath);
          const filteredAssetFiles = assetFiles.filter(file => !systemFiles.includes(file));
          console.log(`Layer ${layerName} files:`, filteredAssetFiles);
          
          for (const assetFile of filteredAssetFiles) {
            const assetPath = path.join(itemPath, assetFile);
            const assetStats = await fs.stat(assetPath);
            
            if (assetStats.isFile()) {
              const ext = path.extname(assetFile).toLowerCase();
              console.log(`Asset: ${assetFile}, extension: ${ext}`);
              if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
                assets.push({
                  filename: assetFile,
                  filePath: assetPath,
                  relativePath: path.join(layerName, assetFile)
                });
              }
            }
          }
          
          console.log(`Layer ${layerName} valid assets:`, assets.length);
          
          if (assets.length > 0) {
            layers.push({
              name: layerName,
              assets
            });
          }
        }
      }
    }
    
    console.log('Total layers found:', layers.length);

    if (layers.length === 0) {
      await fs.remove(extractPath);
      await fs.remove(zipPath);
      return res.status(400).json({ error: 'No valid image layers found in zip file' });
    }

    // Save project to database
    const db = getDatabase();
    
    db.run('INSERT INTO projects (user_id, name, description, folder_path) VALUES (?, ?, ?, ?)',
      [userId, projectName || 'Untitled Project', description || '', extractPath],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save project' });
        }

        const projectId = this.lastID;
        console.log('Project saved with ID:', projectId);

        // Save layers and assets
        let completedLayers = 0;
        layers.forEach((layer, layerIndex) => {
          db.run('INSERT INTO layers (project_id, name, z_index, rarity_percentage) VALUES (?, ?, ?, ?)',
            [projectId, layer.name, layerIndex, 100.0],
            function(err) {
              if (err) {
                console.error('Layer save error:', err);
                return;
              }
              
              const layerId = this.lastID;
              let completedAssets = 0;
              
              layer.assets.forEach(asset => {
                db.run(`INSERT INTO assets (layer_id, filename, file_path, rarity_weight) 
                       VALUES (?, ?, ?, ?)`,
                  [layerId, asset.filename, asset.relativePath, 1.0],
                  function(err) {
                    if (err) {
                      console.error('Asset save error:', err);
                    }
                    
                    completedAssets++;
                    if (completedAssets === layer.assets.length) {
                      completedLayers++;
                      if (completedLayers === layers.length) {
                        // All layers and assets saved
                        res.json({
                          message: 'Project uploaded successfully',
                          projectId,
                          layers: layers.map(l => ({
                            name: l.name,
                            assetCount: l.assets.length
                          }))
                        });
                      }
                    }
                  }
                );
              });
            }
          );
        });
      }
    );

    // Clean up uploaded zip file
    await fs.remove(zipPath);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

// Get user's projects
router.get('/projects', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const db = getDatabase();
  
  db.all(`SELECT p.*, 
          (SELECT COUNT(*) FROM layers WHERE project_id = p.id) as layer_count,
          (SELECT COUNT(*) FROM assets a 
           JOIN layers l ON a.layer_id = l.id 
           WHERE l.project_id = p.id) as asset_count
          FROM projects p 
          WHERE p.user_id = ? 
          ORDER BY p.created_at DESC`, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({ projects: rows });
  });
});

// Delete project
router.delete('/projects/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = getDatabase();
  
  try {
    // Verify user owns this project
    db.get('SELECT folder_path FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], async (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Delete from database (cascade will handle related records)
      db.run('DELETE FROM projects WHERE id = ?', [projectId], async function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete project' });
        }
        
        // Clean up extracted files
        try {
          await fs.remove(project.folder_path);
        } catch (cleanupError) {
          console.error('Failed to cleanup project files:', cleanupError);
        }
        
        res.json({ message: 'Project deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

module.exports = router; 