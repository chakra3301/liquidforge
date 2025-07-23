import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav className="w-full bg-black border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">NFT</span>
          </div>
          <span className="text-xl font-semibold text-white">Liquid Forge</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <Link
            to="/dashboard"
            className="text-text-secondary hover:text-white transition-colors text-sm font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/upload"
            className="text-text-secondary hover:text-white transition-colors text-sm font-medium"
          >
            Upload
          </Link>
          {user && (
            <>
              <span className="text-sm text-text-muted">{user.email || 'User'}</span>
              <button 
                onClick={handleLogout} 
                className="modern-button-secondary text-sm"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 