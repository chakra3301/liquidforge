const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

// Import routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const layerRoutes = require('./routes/layers');
const rarityRoutes = require('./routes/rarity');
const generateRoutes = require('./routes/generate');
const downloadRoutes = require('./routes/download');
const assetRoutes = require('./routes/assets');

// Import database initialization
const { initDatabase } = require('./database/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create necessary directories
const dirs = ['uploads', 'extracted', 'generated', 'temp'];
dirs.forEach(dir => {
  fs.ensureDirSync(path.join(__dirname, '..', dir));
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/layers', layerRoutes);
app.use('/api/rarity', rarityRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/assets', assetRoutes);

// Serve generated images
app.use('/generated', express.static(path.join(__dirname, '..', 'generated')));

// Note: Asset serving is now handled by /api/assets/:projectId/* route

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ 
      error: 'Frontend not built',
      message: 'Please run npm run build in the client directory or start the React development server'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend will be available at http://localhost:3000`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 