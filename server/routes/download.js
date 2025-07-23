const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');
const { getDb } = require('../database/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Download all generated NFTs as ZIP
router.get('/:projectId/zip', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = await getDb();
  
  // Verify user owns this project
  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get all generated NFTs for this project
    db.all('SELECT * FROM generated_nfts WHERE project_id = ? ORDER BY edition_number', [projectId], async (err, nfts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (nfts.length === 0) {
        return res.status(404).json({ error: 'No NFTs found for this project' });
      }
      
      try {
        // Create ZIP file
        const zipPath = path.join(__dirname, '..', '..', 'temp', `nfts-${projectId}-${Date.now()}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => {
          res.download(zipPath, `nfts-${project.name}.zip`, (err) => {
            // Clean up temp file
            fs.remove(zipPath).catch(console.error);
          });
        });
        
        archive.on('error', (err) => {
          res.status(500).json({ error: 'Failed to create ZIP file' });
        });
        
        archive.pipe(output);
        
        // Add images and metadata to ZIP
        for (const nft of nfts) {
          const imagePath = path.join(__dirname, '..', '..', nft.image_path);
          const metadataPath = path.join(__dirname, '..', '..', nft.metadata_path);
          
          if (await fs.pathExists(imagePath)) {
            archive.file(imagePath, { name: `images/${nft.edition_number.toString().padStart(4, '0')}.png` });
          }
          
          if (await fs.pathExists(metadataPath)) {
            archive.file(metadataPath, { name: `metadata/${nft.edition_number.toString().padStart(4, '0')}.json` });
          }
        }
        
        // Add collection metadata
        const collectionMetadata = {
          name: project.name,
          description: project.description,
          total_supply: nfts.length,
          created_at: new Date().toISOString()
        };
        
        archive.append(JSON.stringify(collectionMetadata, null, 2), { name: 'collection.json' });
        
        await archive.finalize();
        
      } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to create download' });
      }
    });
  });
});

// Download metadata as single JSON file
router.get('/:projectId/metadata', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = await getDb();
  
  // Verify user owns this project
  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get all generated NFTs with metadata
    db.all('SELECT * FROM generated_nfts WHERE project_id = ? ORDER BY edition_number', [projectId], async (err, nfts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (nfts.length === 0) {
        return res.status(404).json({ error: 'No NFTs found for this project' });
      }
      
      try {
        const metadataArray = [];
        
        for (const nft of nfts) {
          const metadataPath = path.join(__dirname, '..', '..', nft.metadata_path);
          
          if (await fs.pathExists(metadataPath)) {
            const metadata = await fs.readJson(metadataPath);
            metadataArray.push(metadata);
          }
        }
        
        const collectionMetadata = {
          collection: {
            name: project.name,
            description: project.description,
            total_supply: nfts.length,
            created_at: new Date().toISOString()
          },
          nfts: metadataArray
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="metadata-${project.name}.json"`);
        res.json(collectionMetadata);
        
      } catch (error) {
        console.error('Metadata download error:', error);
        res.status(500).json({ error: 'Failed to read metadata' });
      }
    });
  });
});

// Download metadata as CSV
router.get('/:projectId/csv', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = await getDb();
  
  // Verify user owns this project
  db.get('SELECT * FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get all generated NFTs with metadata
    db.all('SELECT * FROM generated_nfts WHERE project_id = ? ORDER BY edition_number', [projectId], async (err, nfts) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (nfts.length === 0) {
        return res.status(404).json({ error: 'No NFTs found for this project' });
      }
      
      try {
        const metadataArray = [];
        const allTraits = new Set();
        
        // Collect all metadata and traits
        for (const nft of nfts) {
          const metadataPath = path.join(__dirname, '..', '..', nft.metadata_path);
          
          if (await fs.pathExists(metadataPath)) {
            const metadata = await fs.readJson(metadataPath);
            metadataArray.push(metadata);
            
            // Collect all trait types
            metadata.attributes.forEach(attr => {
              allTraits.add(attr.trait_type);
            });
          }
        }
        
        // Create CSV content
        const traitTypes = Array.from(allTraits).sort();
        const csvHeaders = ['Edition', 'Name', 'Description', 'Image', ...traitTypes];
        
        let csvContent = csvHeaders.join(',') + '\n';
        
        metadataArray.forEach(nft => {
          const row = [
            nft.edition,
            `"${nft.name}"`,
            `"${nft.description}"`,
            nft.image
          ];
          
          // Add trait values
          traitTypes.forEach(traitType => {
            const trait = nft.attributes.find(attr => attr.trait_type === traitType);
            row.push(trait ? `"${trait.value}"` : '');
          });
          
          csvContent += row.join(',') + '\n';
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="metadata-${project.name}.csv"`);
        res.send(csvContent);
        
      } catch (error) {
        console.error('CSV download error:', error);
        res.status(500).json({ error: 'Failed to create CSV' });
      }
    });
  });
});

// Get download statistics
router.get('/:projectId/stats', authenticateToken, async (req, res) => {
  const { projectId } = req.params;
  const userId = req.user.userId;
  const db = await getDb();
  
  // Verify user owns this project
  db.get('SELECT id FROM projects WHERE id = ? AND user_id = ?', [projectId, userId], (err, project) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get download statistics
    db.get(`SELECT COUNT(*) as total_nfts,
            MIN(edition_number) as min_edition,
            MAX(edition_number) as max_edition,
            COUNT(CASE WHEN image_path IS NOT NULL THEN 1 END) as images_generated,
            COUNT(CASE WHEN metadata_path IS NOT NULL THEN 1 END) as metadata_generated
            FROM generated_nfts 
            WHERE project_id = ?`, [projectId], (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        total_nfts: stats.total_nfts || 0,
        min_edition: stats.min_edition || 0,
        max_edition: stats.max_edition || 0,
        images_generated: stats.images_generated || 0,
        metadata_generated: stats.metadata_generated || 0
      });
    });
  });
});

module.exports = router; 