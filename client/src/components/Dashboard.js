import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Folder, Image, Settings, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectUpload from './ProjectUpload';
import { getProjects, deleteProject } from '../api';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await getProjects();
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
      await deleteProject(projectId);
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
        <div className="modern-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="modern-space-y-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="modern-heading-lg">My Projects</h1>
            <p className="modern-text-secondary">Manage your NFT art generation projects</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="modern-button-primary"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </div>

        {showUpload && (
          <ProjectUpload onUploaded={handleProjectUploaded} onCancel={() => setShowUpload(false)} />
        )}

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Folder className="mx-auto h-16 w-16 text-text-muted" />
            <h3 className="mt-4 modern-heading-sm">No projects</h3>
            <p className="mt-2 modern-text-secondary">
              Get started by creating a new project.
            </p>
            <div className="mt-8">
              <button
                onClick={() => setShowUpload(true)}
                className="modern-button-primary"
              >
                <Plus className="h-5 w-5" />
                <span>New Project</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="modern-grid modern-grid-3">
            {projects.map((project) => (
              <div key={project.id} className="modern-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="modern-heading-sm">{project.name}</h3>
                    <p className="modern-text-sm">{project.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-text-muted hover:text-red-400 p-1 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="modern-space-y-sm mb-6">
                  <div className="flex items-center modern-text-sm">
                    <Folder size={16} className="mr-2" />
                    <span>{project.layer_count || 0} layers</span>
                  </div>
                  <div className="flex items-center modern-text-sm">
                    <Image size={16} className="mr-2" />
                    <span>{project.asset_count || 0} assets</span>
                  </div>
                  <div className="modern-text-xs">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/editor/${project.id}`}
                    className="modern-button flex-1 justify-center"
                  >
                    <Settings size={16} />
                    <span>Edit</span>
                  </Link>
                  <button
                    className="modern-button-secondary"
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
    </div>
  );
};

export default Dashboard; 