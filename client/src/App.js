import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets/:projectId" element={<AssetViewer />} />
          <Route path="/editor/:projectId" element={<ProjectEditor />} />
          <Route path="/canvas/:projectId" element={<CanvasEditor />} />
          <Route path="/layers/:projectId" element={<LayerManager />} />
          <Route path="/rarity/:projectId" element={<RarityManager />} />
          <Route path="/generate/:projectId" element={<NFTGenerator />} />
          <Route path="/image/:projectId/:assetId" element={<ImageModal />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 