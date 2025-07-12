import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Configure axios base URL for production
if (process.env.NODE_ENV === 'production') {
  // In production, use relative URLs since frontend and backend are on same domain
  window.API_BASE_URL = '';
} else {
  // In development, use localhost
  window.API_BASE_URL = 'http://localhost:5001';
}

function AppContent() {
  const { user, loading } = useAuth();

  console.log('AppContent render:', { user, loading });

  return (
    <Router>
      <div className="min-h-screen bg-black text-white p-8">
        <Navbar />
        <h1 className="text-4xl mb-4">Liquid Forge</h1>
        <p>Debug Info:</p>
        <p>Loading: {loading ? 'true' : 'false'}</p>
        <p>User: {user ? 'logged in' : 'not logged in'}</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 