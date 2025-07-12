import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Layers, Download, Play, Eye, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import LayerManager from './LayerManager';
import RarityManager from './RarityManager';
import NFTGenerator from './NFTGenerator';
import AssetViewer from './AssetViewer';

const ProjectEditor = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('layers');
  const [project, setProject] = useState(null);
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectData = useCallback(async () => {
    try {
      const [projectRes, layersRes] = await Promise.all([
        axios.get(`/api/upload/projects`),
        axios.get(`/api/layers/${projectId}`)
      ]);

      const projectData = projectRes.data.projects.find(p => p.id === parseInt(projectId));
      setProject(projectData);
      setLayers(layersRes.data.layers);
    } catch (error) {
      toast.error('Failed to load project data');
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const tabs = [
    { id: 'layers', name: 'Layers', icon: Layers },
    { id: 'assets', name: 'Assets', icon: Image },
    { id: 'rarity', name: 'Rarity', icon: Eye },
    { id: 'generate', name: 'Generate', icon: Play },
    { id: 'download', name: 'Download', icon: Download },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan cyber-glow"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-cyber-cyan cyber-text">Project not found</h2>
        <p className="text-cyber-cyan-light mt-2">The project you're looking for doesn't exist.</p>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'layers':
        return <LayerManager projectId={projectId} layers={layers} onLayersUpdate={fetchProjectData} />;
      case 'assets':
        return <AssetViewer projectId={projectId} layers={layers} />;
      case 'rarity':
        return <RarityManager projectId={projectId} layers={layers} />;
      case 'generate':
        return <NFTGenerator projectId={projectId} project={project} />;
      case 'download':
        return <DownloadManager projectId={projectId} project={project} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-cyber-cyan cyber-text">{project.name}</h1>
        <p className="text-cyber-cyan-light mt-2">{project.description || 'No description'}</p>
      </div>

      <div className="border-b border-cyber-cyan cyber-glow">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'border-cyber-cyan text-cyber-cyan cyber-text'
                    : 'border-transparent text-cyber-cyan-light hover:text-cyber-cyan hover:border-cyber-cyan'
                }`}
              >
                <Icon size={16} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-h-96">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Download Manager Component
const DownloadManager = ({ projectId, project }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`/api/download/${projectId}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [projectId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDownload = async (type) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/download/${projectId}/${type}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${project.name}-${type}.${type === 'csv' ? 'csv' : 'zip'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${type.toUpperCase()} download started`);
    } catch (error) {
      toast.error('Download failed');
      console.error('Download error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="cyber-card p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-cyber-cyan cyber-text mb-4">Download Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
            <div className="text-2xl font-bold text-cyber-cyan cyber-text">{stats.total_nfts}</div>
            <div className="text-sm text-cyber-cyan-light">Total NFTs</div>
          </div>
          <div className="text-center p-4 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
            <div className="text-2xl font-bold text-cyber-cyan cyber-text">{stats.images_generated}</div>
            <div className="text-sm text-cyber-cyan-light">Images Generated</div>
          </div>
          <div className="text-center p-4 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
            <div className="text-2xl font-bold text-cyber-cyan cyber-text">{stats.metadata_generated}</div>
            <div className="text-sm text-cyber-cyan-light">Metadata Files</div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleDownload('zip')}
            disabled={loading || stats.total_nfts === 0}
            className="w-full cyber-button flex items-center justify-center space-x-2 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Download All (ZIP)</span>
          </button>
          
          <button
            onClick={() => handleDownload('metadata')}
            disabled={loading || stats.total_nfts === 0}
            className="w-full cyber-button flex items-center justify-center space-x-2 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Download Metadata (JSON)</span>
          </button>
          
          <button
            onClick={() => handleDownload('csv')}
            disabled={loading || stats.total_nfts === 0}
            className="w-full cyber-button flex items-center justify-center space-x-2 px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            <span>Download Metadata (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor; 