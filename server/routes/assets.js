const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { getDatabase } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Serve generated images
router.get('/generated/*', async (req, res) => {
  try {
    const imagePath = req.params[0]; // This captures everything after generated/
    
    // Construct the full path to the generated image
    const fullImagePath = path.join(__dirname, '..', '..', 'generated', imagePath);
    
    // Check if file exists
    try {
      const stats = await fs.stat(fullImagePath);
      if (!stats.isFile()) {
        return res.status(404).json({ error: 'Generated image not found' });
      }
      
      // Set appropriate headers for images
      const ext = path.extname(fullImagePath).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
      };
      
      res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Stream the file
      const stream = fs.createReadStream(fullImagePath);
      stream.pipe(res);
      
    } catch (fileError) {
      console.error('Generated file error:', fileError);
      return res.status(404).json({ error: 'Generated image not found' });
    }
    
  } catch (error) {
    console.error('Generated image serving error:', error);
    res.status(500).json({ error: 'Failed to serve generated image' });
  }
});

// Serve project assets
router.get('/:projectId/*', async (req, res) => {
  try {
    const { projectId } = req.params;
    const assetPath = req.params[0]; // This captures everything after projectId/
    
    const db = getDatabase();
    
    // Verify project exists (we'll add user verification later if needed)
    db.get('SELECT folder_path FROM projects WHERE id = ?', [projectId], async (err, project) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Construct the full path to the asset
      const fullAssetPath = path.join(project.folder_path, assetPath);
      
      // Check if file exists
      try {
        const stats = await fs.stat(fullAssetPath);
        if (!stats.isFile()) {
          return res.status(404).json({ error: 'Asset not found' });
        }
        
        // Set appropriate headers
        const ext = path.extname(fullAssetPath).toLowerCase();
        const mimeTypes = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        };
        
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        
        // Stream the file
        const stream = fs.createReadStream(fullAssetPath);
        stream.pipe(res);
        
      } catch (fileError) {
        console.error('File error:', fileError);
        return res.status(404).json({ error: 'Asset not found' });
      }
    });
    
  } catch (error) {
    console.error('Asset serving error:', error);
    res.status(500).json({ error: 'Failed to serve asset' });
  }
});

module.exports = router; 