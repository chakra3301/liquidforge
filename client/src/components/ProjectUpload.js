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
    <div className="modern-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="modern-heading-sm">Upload New Project</h2>
        <button
          onClick={onCancel}
          className="text-text-muted hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="modern-space-y">
        <div>
          <label htmlFor="projectName" className="block modern-text-sm mb-2">
            Project Name
          </label>
          <input
            id="projectName"
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="modern-input"
            placeholder="Enter project name"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block modern-text-sm mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="modern-textarea"
            placeholder="Enter project description"
            rows={3}
          />
        </div>

        <div>
          <label className="block modern-text-sm mb-2">Project ZIP File</label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-accent bg-accent/5'
                : 'border-border hover:border-border-light'
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="space-y-2">
                <File className="mx-auto h-8 w-8 text-accent" />
                <p className="modern-text-sm">{selectedFile.name}</p>
                <p className="modern-text-xs text-text-muted">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={removeFile}
                  className="modern-button-secondary text-xs"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-8 w-8 text-text-muted" />
                <p className="modern-text-sm">
                  {isDragActive ? 'Drop the ZIP file here' : 'Drag & drop a ZIP file here'}
                </p>
                <p className="modern-text-xs text-text-muted">
                  or click to select a file
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="modern-text-sm font-medium text-blue-400">Project Structure</h4>
              <p className="modern-text-xs text-text-secondary mt-1">
                Your ZIP file should contain folders, where each folder represents a layer. 
                Each layer folder should contain image files (PNG, JPG, etc.) that will be 
                used to generate the NFTs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="modern-button-primary flex-1"
          >
            {uploading ? 'Uploading...' : 'Upload Project'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="modern-button-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectUpload; 