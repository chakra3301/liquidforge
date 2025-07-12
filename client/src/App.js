import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  return (
    <Router>
      <div className="min-h-screen bg-black text-white p-8">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-cyber-cyan">Loading...</div>
          ) : (
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/project/:projectId" element={user ? <ProjectEditor /> : <Navigate to="/login" />} />
              <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            </Routes>
          )}
        </main>
        {/* Debug info below main content */}
        <div className="mt-8">
          <h1 className="text-4xl mb-4">Liquid Forge</h1>
          <p>Debug Info:</p>
          <p>Loading: {loading ? 'true' : 'false'}</p>
          <p>User: {user ? 'logged in' : 'not logged in'}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
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