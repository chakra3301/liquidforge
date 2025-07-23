import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadProject } from '../api';

const ProjectUpload = ({ onUploaded, onCancel }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
        setSelectedFile(file);
      } else {
        toast.error('Please select a ZIP file');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip']
    },
    multiple: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a ZIP file');
      return;
    }
    
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setUploading(true);
    
    try {
      await uploadProject({ file: selectedFile, projectName, description });

      toast.success('Project uploaded successfully!');
      onUploaded();
    } catch (error) {
      const errorMessage = error.message || 'Upload failed';
      toast.error(errorMessage);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="cyber-card p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-cyber-cyan cyber-text">Upload New Project</h2>
        <button
          onClick={onCancel}
          className="text-cyber-cyan hover:text-cyber-cyan-light transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-cyber-cyan mb-2">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="cyber-input w-full px-3 py-2 rounded-md"
            placeholder="Enter project name"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-cyber-cyan mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="cyber-input w-full px-3 py-2 rounded-md"
            rows={3}
            placeholder="Enter project description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyber-cyan mb-2">Upload ZIP File</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors cyber-glow ${
              isDragActive
                ? 'border-cyber-cyan bg-cyber-gray'
                : 'border-cyber-cyan hover:border-cyber-cyan-light'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-cyber-cyan" />
            <p className="mt-2 text-sm text-cyber-cyan-light">
              {isDragActive
                ? 'Drop the ZIP file here...'
                : 'Drag and drop a ZIP file here, or click to select'}
            </p>
            <p className="text-xs text-cyber-cyan-light mt-1">
              The ZIP file should contain folders, each representing a layer
            </p>
          </div>
        </div>

        {selectedFile && (
          <div className="flex items-center justify-between p-3 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
            <div className="flex items-center space-x-3">
              <File className="h-5 w-5 text-cyber-cyan" />
              <div>
                <p className="text-sm font-medium text-cyber-cyan">{selectedFile.name}</p>
                <p className="text-xs text-cyber-cyan-light">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-cyber-cyan hover:text-cyber-cyan-light"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="bg-cyber-gray border border-cyber-cyan rounded-lg p-4 cyber-glow">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-cyber-cyan mt-0.5 cyber-glow" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-cyber-cyan cyber-text">ZIP File Structure</h3>
              <div className="mt-2 text-sm text-cyber-cyan-light">
                <p><strong>Important:</strong> Layer folders must be at the root level of the ZIP file.</p>
                <p className="mt-1">Your ZIP file should contain folders, each representing a layer:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>background/ - Background images</li>
                  <li>character/ - Character body images</li>
                  <li>head/ - Head/face images</li>
                  <li>accessories/ - Accessory images</li>
                </ul>
                <p className="mt-2">Each folder should contain PNG, JPG, or WebP images.</p>
                <p className="mt-2 text-xs text-cyber-cyan">
                  ❌ Don't put folders inside another folder (e.g., my-project/background/)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="cyber-button px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading || !selectedFile || !projectName.trim()}
            className="cyber-button px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Project'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectUpload; 