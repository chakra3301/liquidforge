import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Image, Settings, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectUpload from './ProjectUpload';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await window.electronAPI.apiProjects();
      setProjects(response.projects);
    } catch (error) {
      toast.error('Failed to load projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUploaded = () => {
    setShowUpload(false);
    fetchProjects();
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await window.electronAPI.apiProjectsDelete({ projectId });
      toast.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
      console.error('Error deleting project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan cyber-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cyber-cyan cyber-text">My Projects</h1>
          <p className="text-cyber-cyan-light mt-2">Manage your NFT art generation projects</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="cyber-button flex items-center space-x-2 px-4 py-2 rounded-lg"
        >
          <Plus size={20} />
          <span>New Project</span>
        </button>
      </div>

      {showUpload && (
        <ProjectUpload onUploaded={handleProjectUploaded} onCancel={() => setShowUpload(false)} />
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="mx-auto h-12 w-12 text-cyber-cyan cyber-glow" />
          <h3 className="mt-2 text-sm font-medium text-cyber-cyan cyber-text">No projects</h3>
          <p className="mt-1 text-sm text-cyber-cyan-light">
            Get started by creating a new project.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowUpload(true)}
              className="cyber-button px-4 py-2 rounded-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="cyber-card p-6 rounded-lg hover:cyber-glow-strong transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-cyber-cyan cyber-text">{project.name}</h3>
                  <p className="text-sm text-cyber-cyan-light">{project.description || 'No description'}</p>
                </div>
                <button
                  onClick={() => handleDeleteProject(project.id)}
                  className="text-red-400 hover:text-red-300 p-1 transition-colors"
                  title="Delete project"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-cyber-cyan-light">
                  <Folder size={16} className="mr-2" />
                  <span>{project.layer_count || 0} layers</span>
                </div>
                <div className="flex items-center text-sm text-cyber-cyan-light">
                  <Image size={16} className="mr-2" />
                  <span>{project.asset_count || 0} assets</span>
                </div>
                <div className="text-sm text-cyber-cyan-light">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="flex space-x-2">
                <Link
                  to={`/editor/${project.id}`}
                  className="cyber-button flex-1 text-center px-3 py-2 rounded-lg"
                >
                  <Settings size={16} className="mr-2" />
                  Edit
                </Link>
                <button
                  className="cyber-button px-3 py-2 rounded-lg"
                  title="Download generated NFTs"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 