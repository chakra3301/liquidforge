const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { initDatabase } = require('./database/database');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://liquidforge.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

// Middleware
app.use(cors(corsOptions));

// Additional CORS headers for preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/layers', require('./routes/layers'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/generate', require('./routes/generate'));
app.use('/api/download', require('./routes/download'));
app.use('/api/rarity', require('./routes/rarity'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve generated images
app.use('/generated', express.static(path.join(__dirname, '../generated')));

const PORT = process.env.PORT || 5001;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app; 