import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import AssetViewer from './components/AssetViewer';
import CanvasEditor from './components/CanvasEditor';
import ImageModal from './components/ImageModal';
import LayerManager from './components/LayerManager';
import Navbar from './components/Navbar';
import NFTGenerator from './components/NFTGenerator';
import ProjectEditor from './components/ProjectEditor';
import ProjectUpload from './components/ProjectUpload';
import RarityManager from './components/RarityManager';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import './App.css';
// No axios configuration needed - using IPC for Electron

// Wrapper component for upload route
const UploadPage = () => {
  const navigate = useNavigate();
  
  const handleUploaded = () => {
    navigate('/dashboard');
  };
  
  const handleCancel = () => {
    navigate('/dashboard');
  };
  
  return <ProjectUpload onUploaded={handleUploaded} onCancel={handleCancel} />;
};

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/assets/:projectId" element={<RequireAuth><AssetViewer /></RequireAuth>} />
          <Route path="/editor/:projectId" element={<RequireAuth><ProjectEditor /></RequireAuth>} />
          <Route path="/canvas/:projectId" element={<RequireAuth><CanvasEditor /></RequireAuth>} />
          <Route path="/layers/:projectId" element={<RequireAuth><LayerManager /></RequireAuth>} />
          <Route path="/rarity/:projectId" element={<RequireAuth><RarityManager /></RequireAuth>} />
          <Route path="/generate/:projectId" element={<RequireAuth><NFTGenerator /></RequireAuth>} />
          <Route path="/image/:projectId/:assetId" element={<RequireAuth><ImageModal /></RequireAuth>} />
          <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 