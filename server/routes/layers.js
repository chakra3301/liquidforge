const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { getDatabase } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all layers for a project
router.get('/:projectId', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // First verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get layers with assets
    db.all(`SELECT l.*, 
            (SELECT COUNT(*) FROM assets WHERE layer_id = l.id) as asset_count
            FROM layers l 
            WHERE l.project_id = ? 
            ORDER BY l.z_index`, [projectId], (err, layers) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ layers });
    });
  });
});

// Get assets for a specific layer
router.get('/:projectId/:layerId/assets', authenticateToken, (req, res) => {
  const { projectId, layerId } = req.params;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get assets for the layer
    db.all('SELECT * FROM assets WHERE layer_id = ? ORDER BY filename', [layerId], (err, assets) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ assets });
    });
  });
});

// Update layer order (z-index)
router.put('/:projectId/order', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const { layers } = req.body; // Array of { id, z_index }
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update z-index for each layer
    let completed = 0;
    layers.forEach(layer => {
      db.run('UPDATE layers SET z_index = ? WHERE id = ? AND project_id = ?', 
        [layer.z_index, layer.id, projectId], function(err) {
        if (err) {
          console.error('Layer update error:', err);
        }
        
        completed++;
        if (completed === layers.length) {
          res.json({ message: 'Layer order updated successfully' });
        }
      });
    });
  });
});

// Update layer rarity percentage
router.put('/:projectId/layers/:layerId/rarity', authenticateToken, (req, res) => {
  const { projectId, layerId } = req.params;
  const { rarity_percentage } = req.body;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Validate rarity percentage
  if (rarity_percentage < 0 || rarity_percentage > 100) {
    return res.status(400).json({ error: 'Rarity percentage must be between 0 and 100' });
  }
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update layer rarity
    db.run('UPDATE layers SET rarity_percentage = ? WHERE id = ? AND project_id = ?', 
      [rarity_percentage, layerId, projectId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update layer rarity' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Layer not found' });
      }
      
      res.json({ message: 'Layer rarity updated successfully' });
    });
  });
});

// Update asset transformations
router.put('/:projectId/assets/:assetId', authenticateToken, (req, res) => {
  const { projectId, assetId } = req.params;
  const { position_x, position_y, scale_x, scale_y, rotation } = req.body;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update asset transformations
    db.run(`UPDATE assets SET 
            position_x = ?, position_y = ?, 
            scale_x = ?, scale_y = ?, 
            rotation = ?
            WHERE id = ? AND layer_id IN 
            (SELECT id FROM layers WHERE project_id = ?)`,
      [position_x || 0, position_y || 0, 
       scale_x || 1.0, scale_y || 1.0, 
       rotation || 0, assetId, projectId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update asset' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      
      res.json({ message: 'Asset updated successfully' });
    });
  });
});

// Get project settings
router.get('/:projectId/settings', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get or create project settings
    db.get('SELECT * FROM project_settings WHERE project_id = ?', [projectId], (err, settings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!settings) {
        // Create default settings
        db.run('INSERT INTO project_settings (project_id) VALUES (?)', [projectId], function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create settings' });
          }
          
          res.json({
            canvas_width: 1000,
            canvas_height: 1000,
            background_color: '#ffffff'
          });
        });
      } else {
        res.json(settings);
      }
    });
  });
});

// Update project settings
router.put('/:projectId/settings', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const { canvas_width, canvas_height, background_color } = req.body;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update project settings
    db.run(`INSERT OR REPLACE INTO project_settings 
            (project_id, canvas_width, canvas_height, background_color) 
            VALUES (?, ?, ?, ?)`,
      [projectId, canvas_width || 1000, canvas_height || 1000, background_color || '#ffffff'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update settings' });
        }
        
        res.json({ message: 'Settings updated successfully' });
      }
    );
  });
});

// Delete layer
router.delete('/:projectId/layers/:layerId', authenticateToken, (req, res) => {
  const { projectId, layerId } = req.params;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify layer exists and belongs to this project
    db.get('SELECT id FROM layers WHERE id = ? AND project_id = ?', [layerId, projectId], (err, layer) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!layer) {
        return res.status(404).json({ error: 'Layer not found' });
      }
      
      // Delete layer (this will cascade delete assets due to foreign key constraints)
      db.run('DELETE FROM layers WHERE id = ? AND project_id = ?', [layerId, projectId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete layer' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Layer not found' });
        }
        
        // Update z-index for remaining layers
        db.run(`UPDATE layers SET z_index = z_index - 1 
                WHERE project_id = ? AND z_index > 
                (SELECT z_index FROM layers WHERE id = ?)`, [projectId, layerId], function(err) {
          if (err) {
            console.error('Error updating z-index after layer deletion:', err);
          }
          
          res.json({ message: 'Layer deleted successfully' });
        });
      });
    });
  });
});

// Get asset compatibility rules for a project
router.get('/:projectId/compatibility', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get all compatibility rules
    db.all(`SELECT ac.*, 
            a1.filename as asset_filename, a1.layer_id as asset_layer_id,
            a2.filename as incompatible_filename, a2.layer_id as incompatible_layer_id,
            l1.name as asset_layer_name, l2.name as incompatible_layer_name
            FROM asset_compatibility ac
            JOIN assets a1 ON ac.asset_id = a1.id
            JOIN assets a2 ON ac.incompatible_asset_id = a2.id
            JOIN layers l1 ON a1.layer_id = l1.id
            JOIN layers l2 ON a2.layer_id = l2.id
            WHERE ac.project_id = ?`, [projectId], (err, rules) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ compatibility_rules: rules });
    });
  });
});

// Add asset compatibility rule
router.post('/:projectId/compatibility', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const { asset_id, incompatible_asset_id } = req.body;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify both assets exist and belong to this project
    db.get(`SELECT COUNT(*) as count FROM assets a
            JOIN layers l ON a.layer_id = l.id
            WHERE a.id IN (?, ?) AND l.project_id = ?`, 
      [asset_id, incompatible_asset_id, projectId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (result.count !== 2) {
        return res.status(400).json({ error: 'One or both assets not found in this project' });
      }
      
      // Add compatibility rule
      db.run(`INSERT OR IGNORE INTO asset_compatibility 
              (project_id, asset_id, incompatible_asset_id) 
              VALUES (?, ?, ?)`, [projectId, asset_id, incompatible_asset_id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to add compatibility rule' });
        }
        
        if (this.changes === 0) {
          return res.status(400).json({ error: 'Compatibility rule already exists' });
        }
        
        res.json({ message: 'Compatibility rule added successfully' });
      });
    });
  });
});

// Delete asset compatibility rule
router.delete('/:projectId/compatibility/:ruleId', authenticateToken, (req, res) => {
  const { projectId, ruleId } = req.params;
  const userId = req.user.userId;
  const db = getDatabase();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete compatibility rule
    db.run('DELETE FROM asset_compatibility WHERE id = ? AND project_id = ?', [ruleId, projectId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete compatibility rule' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Compatibility rule not found' });
      }
      
      res.json({ message: 'Compatibility rule deleted successfully' });
    });
  });
});

module.exports = router; 