import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import ProjectEditor from './components/ProjectEditor';
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

  // Simple test render to debug white screen
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl mb-4">Liquid Forge</h1>
      <p>Debug Info:</p>
      <p>Loading: {loading ? 'true' : 'false'}</p>
      <p>User: {user ? 'logged in' : 'not logged in'}</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
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