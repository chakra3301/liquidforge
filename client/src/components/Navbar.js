import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Upload, Home } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-cyber-dark border-b border-cyber-cyan cyber-glow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2 cyber-animate-glow">
              <div className="w-8 h-8 bg-cyber-cyan rounded-lg flex items-center justify-center cyber-glow">
                <span className="text-cyber-black font-bold text-sm">NFT</span>
              </div>
              <span className="text-xl font-bold text-cyber-cyan cyber-text">Liquid Forge: NFT</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-cyber-cyan hover:text-cyber-cyan-light px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:cyber-glow"
            >
              <Home size={18} />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/upload"
              className="flex items-center space-x-2 text-cyber-cyan hover:text-cyber-cyan-light px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:cyber-glow"
            >
              <Upload size={18} />
              <span>Upload</span>
            </Link>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-cyber-gray border border-cyber-cyan rounded-full flex items-center justify-center cyber-glow">
                <User size={16} className="text-cyber-cyan" />
              </div>
              <span className="text-sm text-cyber-cyan">{user.email}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-cyber-cyan hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:cyber-glow"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 