const express = require('express');
const { getDatabase } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get rarity configuration for a project
router.get('/:projectId', authenticateToken, (req, res) => {
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
    
    // Get all layers with their assets and rarity weights
    db.all(`SELECT l.id as layer_id, l.name as layer_name, l.z_index,
            a.id as asset_id, a.filename, a.rarity_weight
            FROM layers l
            LEFT JOIN assets a ON l.id = a.layer_id
            WHERE l.project_id = ?
            ORDER BY l.z_index, a.filename`, [projectId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Group by layers
      const layers = {};
      rows.forEach(row => {
        if (!layers[row.layer_id]) {
          layers[row.layer_id] = {
            id: row.layer_id,
            name: row.layer_name,
            z_index: row.z_index,
            assets: []
          };
        }
        
        if (row.asset_id) {
          layers[row.layer_id].assets.push({
            id: row.asset_id,
            filename: row.filename,
            rarity_weight: row.rarity_weight
          });
        }
      });
      
      res.json({ 
        layers: Object.values(layers).sort((a, b) => a.z_index - b.z_index)
      });
    });
  });
});

// Update rarity weights for assets
router.put('/:projectId', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const { assets } = req.body; // Array of { id, rarity_weight }
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
    
    // Update rarity weights
    let completed = 0;
    assets.forEach(asset => {
      db.run(`UPDATE assets SET rarity_weight = ? 
              WHERE id = ? AND layer_id IN 
              (SELECT id FROM layers WHERE project_id = ?)`,
        [asset.rarity_weight, asset.id, projectId], function(err) {
        if (err) {
          console.error('Rarity update error:', err);
        }
        
        completed++;
        if (completed === assets.length) {
          res.json({ message: 'Rarity weights updated successfully' });
        }
      });
    });
  });
});

// Get rarity statistics for a project
router.get('/:projectId/stats', authenticateToken, (req, res) => {
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
    
    // Get rarity statistics
    db.all(`SELECT l.name as layer_name,
            COUNT(a.id) as total_assets,
            SUM(a.rarity_weight) as total_weight,
            AVG(a.rarity_weight) as avg_weight,
            MIN(a.rarity_weight) as min_weight,
            MAX(a.rarity_weight) as max_weight
            FROM layers l
            LEFT JOIN assets a ON l.id = a.layer_id
            WHERE l.project_id = ?
            GROUP BY l.id, l.name
            ORDER BY l.z_index`, [projectId], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Calculate percentages
      const stats = rows.map(row => ({
        layer_name: row.layer_name,
        total_assets: row.total_assets,
        total_weight: row.total_weight,
        avg_weight: row.avg_weight,
        min_weight: row.min_weight,
        max_weight: row.max_weight,
        // Calculate what percentage each weight represents
        weight_percentages: row.total_weight > 0 ? 
          (row.total_weight / row.total_assets) * 100 : 0
      }));
      
      res.json({ stats });
    });
  });
});

// Validate rarity weights (ensure they sum to reasonable values)
router.post('/:projectId/validate', authenticateToken, (req, res) => {
  const { projectId } = req.params;
  const { assets } = req.body;
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
    
    // Group assets by layer and validate weights
    const layerWeights = {};
    assets.forEach(asset => {
      if (!layerWeights[asset.layer_id]) {
        layerWeights[asset.layer_id] = [];
      }
      layerWeights[asset.layer_id].push(asset.rarity_weight);
    });
    
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    Object.entries(layerWeights).forEach(([layerId, weights]) => {
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      
      if (totalWeight === 0) {
        validation.valid = false;
        validation.errors.push(`Layer ${layerId}: Total weight cannot be zero`);
      }
      
      if (weights.some(weight => weight < 0)) {
        validation.valid = false;
        validation.errors.push(`Layer ${layerId}: Weights cannot be negative`);
      }
      
      if (totalWeight > 1000) {
        validation.warnings.push(`Layer ${layerId}: Very high total weight (${totalWeight})`);
      }
    });
    
    res.json(validation);
  });
});

module.exports = router; 