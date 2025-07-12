const express = require('express');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate NFTs
router.post('/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { count, collectionName, description, baseUrl } = req.body;
  const userId = req.user.userId;
  const db = getDatabase();
  
  if (!count || count < 1 || count > 10000) {
    return res.status(400).json({ error: 'Count must be between 1 and 10,000' });
  }
  
  try {
    // Verify user owns this project
    const project = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get project settings
    const settings = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM project_settings WHERE project_id = ?', [projectId], (err, row) => {
        if (err) reject(err);
        else resolve(row || { canvas_width: 1000, canvas_height: 1000, background_color: '#ffffff' });
      });
    });
    
    // Get all layers with assets
    const layers = await new Promise((resolve, reject) => {
      db.all(`SELECT l.*, a.id as asset_id, a.filename, a.file_path, a.rarity_weight,
              a.position_x, a.position_y, a.scale_x, a.scale_y, a.rotation
              FROM layers l
              LEFT JOIN assets a ON l.id = a.layer_id
              WHERE l.project_id = ?
              ORDER BY l.z_index, a.filename`, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Group assets by layer
    const layerAssets = {};
    layers.forEach(row => {
      if (!layerAssets[row.id]) {
        layerAssets[row.id] = {
          id: row.id,
          name: row.name,
          z_index: row.z_index,
          assets: []
        };
      }
      
      if (row.asset_id) {
        layerAssets[row.id].assets.push({
          id: row.asset_id,
          filename: row.filename,
          file_path: row.file_path,
          rarity_weight: row.rarity_weight,
          position_x: row.position_x,
          position_y: row.position_y,
          scale_x: row.scale_x,
          scale_y: row.scale_y,
          rotation: row.rotation
        });
      }
    });
    
    const layerList = Object.values(layerAssets).sort((a, b) => a.z_index - b.z_index);
    
    if (layerList.length === 0) {
      return res.status(400).json({ error: 'No layers found in project' });
    }
    
    // Get asset compatibility rules
    const compatibilityRules = await new Promise((resolve, reject) => {
      db.all(`SELECT asset_id, incompatible_asset_id 
              FROM asset_compatibility 
              WHERE project_id = ?`, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Create generation directory
    const generationId = uuidv4();
    const generationDir = path.join(__dirname, '..', '..', 'generated', generationId);
    await fs.ensureDir(generationDir);
    
    // Start generation process
    const generatedNFTs = [];
    const usedCombinations = new Set();
    
    for (let i = 1; i <= count; i++) {
      let combination;
      let attempts = 0;
      const maxAttempts = 1000;
      
      // Generate unique combination
      do {
        combination = generateCombination(layerList, compatibilityRules);
        attempts++;
        
        if (attempts > maxAttempts) {
          return res.status(400).json({ 
            error: 'Unable to generate unique combinations. Try reducing the count or adding more assets.' 
          });
        }
      } while (usedCombinations.has(JSON.stringify(combination)));
      
      usedCombinations.add(JSON.stringify(combination));
      
      // Generate image
      const imagePath = path.join(generationDir, `${i.toString().padStart(4, '0')}.png`);
      await generateImage(combination, settings, project.folder_path, imagePath, layerList);
      
      // Generate metadata
      const metadata = generateMetadata(i, combination, collectionName, description, baseUrl);
      const metadataPath = path.join(generationDir, `${i.toString().padStart(4, '0')}.json`);
      await fs.writeJson(metadataPath, metadata, { spaces: 2 });
      
      // Save to database
      await new Promise((resolve, reject) => {
        db.run('INSERT INTO generated_nfts (project_id, edition_number, image_path, metadata_path) VALUES (?, ?, ?, ?)',
          [projectId, i, path.relative(path.join(__dirname, '..', '..'), imagePath), 
           path.relative(path.join(__dirname, '..', '..'), metadataPath)], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      generatedNFTs.push({
        edition: i,
        image: `/generated/${generationId}/${i.toString().padStart(4, '0')}.png`,
        metadata: metadata
      });
    }
    
    res.json({
      message: `Successfully generated ${count} NFTs`,
      generationId,
      nfts: generatedNFTs
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate NFTs' });
  }
});

// Generate a random combination based on rarity weights and compatibility rules
function generateCombination(layers, compatibilityRules = []) {
  const combination = {};
  const maxAttempts = 1000;
  
  // Create a map of incompatible assets for quick lookup
  const incompatibleMap = new Map();
  compatibilityRules.forEach(rule => {
    if (!incompatibleMap.has(rule.asset_id)) {
      incompatibleMap.set(rule.asset_id, new Set());
    }
    if (!incompatibleMap.has(rule.incompatible_asset_id)) {
      incompatibleMap.set(rule.incompatible_asset_id, new Set());
    }
    incompatibleMap.get(rule.asset_id).add(rule.incompatible_asset_id);
    incompatibleMap.get(rule.incompatible_asset_id).add(rule.asset_id);
  });
  
  // Helper function to check if an asset is compatible with current combination
  const isAssetCompatible = (assetId) => {
    if (!incompatibleMap.has(assetId)) return true;
    
    const incompatibleAssets = incompatibleMap.get(assetId);
    for (const selectedAsset of Object.values(combination)) {
      if (incompatibleAssets.has(selectedAsset.id)) {
        return false;
      }
    }
    return true;
  };
  
  // Helper function to get compatible assets for a layer
  const getCompatibleAssets = (layerAssets) => {
    return layerAssets.filter(asset => isAssetCompatible(asset.id));
  };
  
  layers.forEach(layer => {
    // Check layer rarity first - if less than 100%, there's a chance the layer won't be included
    const layerRarity = layer.rarity_percentage || 100.0;
    const randomPercent = Math.random() * 100;
    
    // If random percentage is greater than layer rarity, skip this layer
    if (randomPercent > layerRarity) {
      return; // Skip this layer
    }
    
    if (layer.assets.length === 0) return;
    
    // Get compatible assets for this layer
    const compatibleAssets = getCompatibleAssets(layer.assets);
    
    if (compatibleAssets.length === 0) {
      // No compatible assets, skip this layer
      return;
    }
    
    // Calculate total weight for compatible assets
    const totalWeight = compatibleAssets.reduce((sum, asset) => sum + asset.rarity_weight, 0);
    
    if (totalWeight <= 0) {
      // If no weights set, use equal probability
      const randomIndex = Math.floor(Math.random() * compatibleAssets.length);
      combination[layer.name] = compatibleAssets[randomIndex];
    } else {
      // Use weighted random selection
      const random = Math.random() * totalWeight;
      let currentWeight = 0;
      
      for (const asset of compatibleAssets) {
        currentWeight += asset.rarity_weight;
        if (random <= currentWeight) {
          combination[layer.name] = asset;
          break;
        }
      }
    }
  });
  
  return combination;
}

// Generate composite image using Sharp
async function generateImage(combination, settings, projectPath, outputPath, layerList) {
  try {
    const canvas = sharp({
      create: {
        width: settings.canvas_width,
        height: settings.canvas_height,
        channels: 4,
        background: settings.background_color
      }
    });

    const assets = layerList.map(layer => combination[layer.name]).filter(Boolean);

    if (assets.length === 0) {
      await canvas.png().toFile(outputPath);
      return;
    }

    const compositeOperations = [];

    for (const asset of assets) {
      try {
        const assetPath = path.join(projectPath, asset.file_path);
        if (!await fs.pathExists(assetPath)) {
          console.warn(`Asset not found: ${assetPath}`);
          continue;
        }

        let img = sharp(assetPath);

        const scaleX = asset.scale_x || 1;
        const scaleY = asset.scale_y || 1;

        const targetWidth = Math.round(settings.canvas_width * scaleX);
        const targetHeight = Math.round(settings.canvas_height * scaleY);

        img = img.resize(targetWidth, targetHeight);

        if (asset.rotation) {
          img = img.rotate(asset.rotation);
        }

        const imgBuffer = await img.png().toBuffer();

        const top = Math.round((asset.position_y || 0) * settings.canvas_height);
        const left = Math.round((asset.position_x || 0) * settings.canvas_width);

        compositeOperations.push({
          input: imgBuffer,
          top,
          left
        });

      } catch (error) {
        console.error(`Error processing asset ${asset.filename}:`, error);
      }
    }

    if (compositeOperations.length > 0) {
      await canvas.composite(compositeOperations).png().toFile(outputPath);
    } else {
      await canvas.png().toFile(outputPath);
    }

  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Generate metadata for NFT
function generateMetadata(edition, combination, collectionName, description, baseUrl) {
  const attributes = Object.entries(combination).map(([layerName, asset]) => ({
    trait_type: layerName,
    value: asset.filename.replace(/\.[^/.]+$/, "") // Remove file extension
  }));
  
  return {
    name: `${collectionName || 'NFT'} #${edition.toString().padStart(4, '0')}`,
    description: description || 'Generated NFT',
    image: `${baseUrl || 'http://localhost:5000'}/generated/${edition.toString().padStart(4, '0')}.png`,
    attributes: attributes,
    edition: edition
  };
}

// Generate preview NFTs
router.post('/:projectId/preview', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const { count = 5 } = req.body;
  const userId = req.user.userId;
  const db = getDatabase();
  
  if (!count || count < 1 || count > 20) {
    return res.status(400).json({ error: 'Preview count must be between 1 and 20' });
  }
  
  try {
    // Verify user owns this project
    const project = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get project settings
    const settings = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM project_settings WHERE project_id = ?', [projectId], (err, row) => {
        if (err) reject(err);
        else resolve(row || { canvas_width: 1000, canvas_height: 1000, background_color: '#ffffff' });
      });
    });
    
    // Get all layers with assets
    const layers = await new Promise((resolve, reject) => {
      db.all(`SELECT l.*, a.id as asset_id, a.filename, a.file_path, a.rarity_weight
              FROM layers l
              LEFT JOIN assets a ON l.id = a.layer_id
              WHERE l.project_id = ?
              ORDER BY l.z_index, a.filename`, [projectId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Group assets by layer
    const layerAssets = {};
    layers.forEach(row => {
      if (!layerAssets[row.id]) {
        layerAssets[row.id] = {
          id: row.id,
          name: row.name,
          z_index: row.z_index,
          assets: []
        };
      }
      
      if (row.asset_id) {
        layerAssets[row.id].assets.push({
          id: row.asset_id,
          filename: row.filename,
          file_path: row.file_path,
          rarity_weight: row.rarity_weight
        });
      }
    });
    
    const layerList = Object.values(layerAssets).sort((a, b) => a.z_index - b.z_index);
    
    if (layerList.length === 0) {
      return res.status(400).json({ error: 'No layers found in project' });
    }
    
    // Create preview directory
    const previewId = `preview-${uuidv4()}`;
    const previewDir = path.join(__dirname, '..', '..', 'generated', previewId);
    await fs.ensureDir(previewDir);
    
    // Generate preview NFTs
    const previewNFTs = [];
    
    for (let i = 1; i <= count; i++) {
      const combination = generateCombination(layerList);
      
      // Generate image
      const imagePath = path.join(previewDir, `preview-${i}.png`);
      await generateImage(combination, settings, project.folder_path, imagePath, layerList);
      
      // Generate metadata
      const metadata = generateMetadata(i, combination, 'Preview', 'Preview NFT', 'http://localhost:5001');
      
      previewNFTs.push({
        edition: i,
        image: `/generated/${previewId}/preview-${i}.png`,
        metadata: metadata,
        combination: combination
      });
    }
    
    res.json({
      message: `Generated ${count} preview NFTs`,
      previewId,
      nfts: previewNFTs
    });
    
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({ error: 'Failed to generate preview NFTs' });
  }
});

// Get generation status
router.get('/:projectId/status', authenticateToken, (req, res) => {
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
    
    // Get generation statistics
    db.get(`SELECT COUNT(*) as total_generated,
            MIN(edition_number) as min_edition,
            MAX(edition_number) as max_edition
            FROM generated_nfts 
            WHERE project_id = ?`, [projectId], (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        total_generated: stats.total_generated || 0,
        min_edition: stats.min_edition || 0,
        max_edition: stats.max_edition || 0
      });
    });
  });
});

module.exports = router; 