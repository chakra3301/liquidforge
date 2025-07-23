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
    <nav className="w-full bg-cyber-dark p-4 border-b border-cyber-cyan flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-cyber-cyan rounded-lg flex items-center justify-center cyber-glow">
          <span className="text-cyber-black font-bold text-sm">NFT</span>
        </div>
        <span className="text-xl font-bold text-cyber-cyan cyber-text">Liquid Forge: NFT</span>
      </div>
      <div className="flex items-center space-x-4">
        <Link
          to="/dashboard"
          className="flex items-center space-x-2 text-cyber-cyan hover:text-cyber-cyan-light px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:cyber-glow"
        >
          Dashboard
        </Link>
        <Link
          to="/upload"
          className="flex items-center space-x-2 text-cyber-cyan hover:text-cyber-cyan-light px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:cyber-glow"
        >
          Upload
        </Link>
        {user && (
          <>
            <span className="text-sm text-cyber-cyan">{user.email || 'User'}</span>
            <button onClick={handleLogout} className="ml-4 cyber-button px-3 py-1 rounded">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 