const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { getDb, promisifyDb } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all layers for a project
router.get('/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // First verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get layers with assets
    const layers = await db.all(`SELECT l.*, 
            (SELECT COUNT(*) FROM assets WHERE layer_id = l.id) as asset_count
            FROM layers l 
            WHERE l.project_id = ? 
            ORDER BY l.z_index`, [projectId]);
    
    res.json({ layers });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get assets for a specific layer
router.get('/:projectId/:layerId/assets', authenticateToken, async (req, res) => {
  try {
    const { projectId, layerId } = req.params;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get assets for the layer
    const assets = await db.all('SELECT * FROM assets WHERE layer_id = ? ORDER BY filename', [layerId]);
    
    res.json({ assets });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update layer order (z-index)
router.put('/:projectId/order', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { layers } = req.body; // Array of { id, z_index }
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update z-index for each layer
    for (const layer of layers) {
      await db.run('UPDATE layers SET z_index = ? WHERE id = ? AND project_id = ?', 
        [layer.z_index, layer.id, projectId]);
    }
    
    res.json({ message: 'Layer order updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update layer rarity percentage
router.put('/:projectId/layers/:layerId/rarity', authenticateToken, async (req, res) => {
  try {
    const { projectId, layerId } = req.params;
    const { rarity_percentage } = req.body;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Validate rarity percentage
    if (rarity_percentage < 0 || rarity_percentage > 100) {
      return res.status(400).json({ error: 'Rarity percentage must be between 0 and 100' });
    }
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update layer rarity
    const result = await db.run('UPDATE layers SET rarity_percentage = ? WHERE id = ? AND project_id = ?', 
      [rarity_percentage, layerId, projectId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    res.json({ message: 'Layer rarity updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update layer rarity' });
  }
});

// Update asset transformations
router.put('/:projectId/assets/:assetId', authenticateToken, async (req, res) => {
  try {
    const { projectId, assetId } = req.params;
    const { position_x, position_y, scale_x, scale_y, rotation } = req.body;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update asset transformations
    const result = await db.run(`UPDATE assets SET 
            position_x = ?, position_y = ?, 
            scale_x = ?, scale_y = ?, 
            rotation = ?
            WHERE id = ? AND layer_id IN 
            (SELECT id FROM layers WHERE project_id = ?)`,
      [position_x || 0, position_y || 0, 
       scale_x || 1.0, scale_y || 1.0, 
       rotation || 0, assetId, projectId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// Get project settings
router.get('/:projectId/settings', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get or create project settings
    const settings = await db.get('SELECT * FROM project_settings WHERE project_id = ?', [projectId]);
    
    if (!settings) {
      // Create default settings
      await db.run('INSERT INTO project_settings (project_id) VALUES (?)', [projectId]);
      
      res.json({
        canvas_width: 1000,
        canvas_height: 1000,
        background_color: '#ffffff'
      });
    } else {
      res.json(settings);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update project settings
router.put('/:projectId/settings', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { canvas_width, canvas_height, background_color } = req.body;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Update project settings
    await db.run(`INSERT OR REPLACE INTO project_settings 
            (project_id, canvas_width, canvas_height, background_color) 
            VALUES (?, ?, ?, ?)`,
      [projectId, canvas_width || 1000, canvas_height || 1000, background_color || '#ffffff']);
    
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Delete layer
router.delete('/:projectId/layers/:layerId', authenticateToken, async (req, res) => {
  try {
    const { projectId, layerId } = req.params;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify layer exists and belongs to this project
    const layer = await db.get('SELECT id FROM layers WHERE id = ? AND project_id = ?', [layerId, projectId]);
    
    if (!layer) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    // Delete layer (this will cascade delete assets due to foreign key constraints)
    const result = await db.run('DELETE FROM layers WHERE id = ? AND project_id = ?', [layerId, projectId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Layer not found' });
    }
    
    // Update z-index for remaining layers
    try {
      await db.run(`UPDATE layers SET z_index = z_index - 1 
              WHERE project_id = ? AND z_index > 
              (SELECT z_index FROM layers WHERE id = ?)`, [projectId, layerId]);
    } catch (updateError) {
      console.error('Error updating z-index after layer deletion:', updateError);
    }
    
    res.json({ message: 'Layer deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete layer' });
  }
});

// Get asset compatibility rules for a project
router.get('/:projectId/compatibility', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get all compatibility rules
    const rules = await db.all(`SELECT ac.*, 
            a1.filename as asset_filename, a1.layer_id as asset_layer_id,
            a2.filename as incompatible_filename, a2.layer_id as incompatible_layer_id,
            l1.name as asset_layer_name, l2.name as incompatible_layer_name
            FROM asset_compatibility ac
            JOIN assets a1 ON ac.asset_id = a1.id
            JOIN assets a2 ON ac.incompatible_asset_id = a2.id
            JOIN layers l1 ON a1.layer_id = l1.id
            JOIN layers l2 ON a2.layer_id = l2.id
            WHERE ac.project_id = ?`, [projectId]);
    
    res.json({ compatibility_rules: rules });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add asset compatibility rule
router.post('/:projectId/compatibility', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { asset_id, incompatible_asset_id } = req.body;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Verify both assets exist and belong to this project
    const result = await db.get(`SELECT COUNT(*) as count FROM assets a
            JOIN layers l ON a.layer_id = l.id
            WHERE a.id IN (?, ?) AND l.project_id = ?`, 
      [asset_id, incompatible_asset_id, projectId]);
    
    if (result.count !== 2) {
      return res.status(400).json({ error: 'One or both assets not found in this project' });
    }
    
    // Add compatibility rule
    const insertResult = await db.run(`INSERT OR IGNORE INTO asset_compatibility 
            (project_id, asset_id, incompatible_asset_id) 
            VALUES (?, ?, ?)`, [projectId, asset_id, incompatible_asset_id]);
    
    if (insertResult.changes === 0) {
      return res.status(400).json({ error: 'Compatibility rule already exists' });
    }
    
    res.json({ message: 'Compatibility rule added successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to add compatibility rule' });
  }
});

// Delete asset compatibility rule
router.delete('/:projectId/compatibility/:ruleId', authenticateToken, async (req, res) => {
  try {
    const { projectId, ruleId } = req.params;
    const userId = req.user.id;
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user owns this project
    const project = await db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Delete compatibility rule
    const result = await db.run('DELETE FROM asset_compatibility WHERE id = ? AND project_id = ?', [ruleId, projectId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Compatibility rule not found' });
    }
    
    res.json({ message: 'Compatibility rule deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to delete compatibility rule' });
  }
});

module.exports = router; 