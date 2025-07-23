const jwt = require('jsonwebtoken');
const { getDb, promisifyDb } = require('../database/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = async (req, res, next) => {
  try {
    console.log('Auth middleware - Headers:', req.headers);
    const authHeader = req.headers['authorization'];
    console.log('Auth middleware - Authorization header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Auth middleware - Extracted token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Auth middleware - Token decoded:', { userId: decoded.userId });
    const database = getDb();
    const db = promisifyDb(database);
    
    // Verify user still exists in database
    const user = await db.get('SELECT id, email FROM users WHERE id = ?', [decoded.userId]);
    console.log('Auth middleware - User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('Auth middleware - User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = { userId: user.id, id: user.id, email: user.email };
    console.log('Auth middleware - Authentication successful for user:', user.email);
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = {
  authenticateToken
}; 