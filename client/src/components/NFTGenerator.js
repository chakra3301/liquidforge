import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Download, BarChart3, AlertCircle, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const NFTGenerator = ({ projectId, project }) => {
  const [generationConfig, setGenerationConfig] = useState({
    count: 100,
    collectionName: project?.name || 'My NFT Collection',
    description: 'Generated NFT collection',
    baseUrl: 'http://localhost:5001'
  });
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState(null);
  const [generatedNFTs, setGeneratedNFTs] = useState([]);
  const [previewNFTs, setPreviewNFTs] = useState([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchGenerationStatus();
  }, [projectId]);

  const fetchGenerationStatus = async () => {
    try {
      const response = await axios.get(`/api/generate/${projectId}/status`);
      setGenerationStatus(response.data);
    } catch (error) {
      console.error('Error fetching generation status:', error);
    }
  };

  const handleConfigChange = (field, value) => {
    setGenerationConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneratePreview = async () => {
    setGeneratingPreview(true);
    
    try {
      const response = await axios.post(`/api/generate/${projectId}/preview`, {
        count: 5
      });
      
      setPreviewNFTs(response.data.nfts || []);
      setShowPreview(true);
      toast.success('Preview generated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Preview generation failed';
      toast.error(errorMessage);
      console.error('Preview generation error:', error);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleGenerate = async () => {
    if (!generationConfig.count || generationConfig.count < 1 || generationConfig.count > 10000) {
      toast.error('Please enter a valid count between 1 and 10,000');
      return;
    }

    if (!generationConfig.collectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    setGenerating(true);
    
    try {
      const response = await axios.post(`/api/generate/${projectId}`, generationConfig);
      
      toast.success(`Successfully generated ${generationConfig.count} NFTs!`);
      setGeneratedNFTs(response.data.nfts || []);
      fetchGenerationStatus();
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Generation failed';
      toast.error(errorMessage);
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      const response = await axios.get(`/api/download/${projectId}/${type}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generationConfig.collectionName}-${type}.${type === 'csv' ? 'csv' : 'zip'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${type.toUpperCase()} download started`);
    } catch (error) {
      toast.error('Download failed');
      console.error('Download error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Configuration */}
        <div className="cyber-card p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-cyber-cyan cyber-text mb-4">Generation Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cyber-cyan mb-2">Number of NFTs</label>
              <input
                type="number"
                value={generationConfig.count}
                onChange={(e) => handleConfigChange('count', parseInt(e.target.value))}
                className="cyber-input w-full px-3 py-2 rounded-md"
                min="1"
                max="10000"
                placeholder="100"
              />
              <p className="text-xs text-cyber-cyan-light mt-1">Maximum 10,000 NFTs per generation</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-cyan mb-2">Collection Name</label>
              <input
                type="text"
                value={generationConfig.collectionName}
                onChange={(e) => handleConfigChange('collectionName', e.target.value)}
                className="cyber-input w-full px-3 py-2 rounded-md"
                placeholder="My NFT Collection"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-cyan mb-2">Description</label>
              <textarea
                value={generationConfig.description}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                className="cyber-input w-full px-3 py-2 rounded-md"
                rows={3}
                placeholder="Generated NFT collection"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyber-cyan mb-2">Base URL</label>
              <input
                type="url"
                value={generationConfig.baseUrl}
                onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                className="cyber-input w-full px-3 py-2 rounded-md"
                placeholder="http://localhost:5000"
              />
              <p className="text-xs text-cyber-cyan-light mt-1">Base URL for image links in metadata</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGeneratePreview}
                disabled={generatingPreview}
                className="cyber-button flex items-center justify-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye size={16} />
                <span>{generatingPreview ? 'Generating...' : 'Preview'}</span>
              </button>
              
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="cyber-button flex items-center justify-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={16} />
                <span>{generating ? 'Generating...' : 'Generate NFTs'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generation Status */}
        <div className="cyber-card p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-cyber-cyan cyber-text mb-4">Generation Status</h3>
          
          {generationStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
                  <div className="text-2xl font-bold text-cyber-cyan cyber-text">
                    {generationStatus.total_generated}
                  </div>
                  <div className="text-sm text-cyber-cyan-light">Total Generated</div>
                </div>
                <div className="text-center p-4 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
                  <div className="text-2xl font-bold text-cyber-cyan cyber-text">
                    {generationStatus.max_edition || 0}
                  </div>
                  <div className="text-sm text-cyber-cyan-light">Latest Edition</div>
                </div>
              </div>

              {generationStatus.total_generated > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-cyber-cyan cyber-text">Download Options</h4>
                  
                  <button
                    onClick={() => handleDownload('zip')}
                    className="w-full cyber-button flex items-center justify-center space-x-2 px-4 py-2 rounded-lg"
                  >
                    <Download size={16} />
                    <span>Download All (ZIP)</span>
                  </button>
                  
                  <button
                    onClick={() => handleDownload('metadata')}
                    className="w-full cyber-button flex items-center justify-center space-x-2 px-4 py-2 rounded-lg"
                  >
                    <Download size={16} />
                    <span>Download Metadata (JSON)</span>
                  </button>
                  
                  <button
                    onClick={() => handleDownload('csv')}
                    className="w-full cyber-button flex items-center justify-center space-x-2 px-4 py-2 rounded-lg"
                  >
                    <Download size={16} />
                    <span>Download Metadata (CSV)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-cyber-cyan-light">
              <BarChart3 className="mx-auto h-12 w-12 mb-4 cyber-glow" />
              <p>No NFTs generated yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Generation Info */}
      <div className="cyber-card p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-cyber-cyan mt-0.5 cyber-glow" />
          <div>
            <h4 className="text-sm font-medium text-cyber-cyan cyber-text">Generation Process</h4>
            <div className="text-sm text-cyber-cyan-light mt-1 space-y-1">
              <p>• Use <strong>Preview</strong> to generate 5 sample NFTs and see how they look</p>
              <p>• Each NFT contains one asset from each layer, composited together</p>
              <p>• Images are positioned exactly as saved from Photoshop (no transformations needed)</p>
              <p>• Rarity weights determine the probability of each asset being selected</p>
              <p>• Full generation creates the complete collection with metadata</p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview NFTs */}
      {showPreview && previewNFTs.length > 0 && (
        <div className="cyber-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-cyber-cyan cyber-text">Preview NFTs</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-sm text-cyber-cyan-light hover:text-cyber-cyan transition-colors"
            >
              Close Preview
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {previewNFTs.map((nft) => (
              <div key={nft.edition} className="text-center">
                <div className="w-full aspect-square bg-cyber-gray border border-cyber-cyan rounded-lg overflow-hidden mb-2 cyber-glow">
                  <img
                    src={`http://localhost:5001${nft.image}`}
                    alt={`Preview ${nft.edition}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                    <span className="text-xs text-cyber-cyan-light">#{nft.edition}</span>
                  </div>
                </div>
                <p className="text-xs text-cyber-cyan font-medium">#{nft.edition}</p>
                <div className="text-xs text-cyber-cyan-light mt-1">
                  {Object.keys(nft.combination).length} layers
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
            <h4 className="text-sm font-medium text-cyber-cyan cyber-text mb-2">Preview Information</h4>
            <div className="text-sm text-cyber-cyan-light space-y-1">
              <p>• These are sample NFTs generated using your current layer configuration</p>
              <p>• Each NFT contains one asset from each layer, composited together</p>
              <p>• Rarity weights are applied during generation</p>
              <p>• If you're satisfied with the preview, proceed with full generation</p>
            </div>
          </div>
        </div>
      )}

      {/* Generated NFTs Preview */}
      {generatedNFTs.length > 0 && (
        <div className="cyber-card p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-cyber-cyan cyber-text mb-4">Recently Generated</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {generatedNFTs.slice(0, 12).map((nft) => (
              <div key={nft.edition} className="text-center">
                <div className="w-full aspect-square bg-cyber-gray border border-cyber-cyan rounded-lg overflow-hidden mb-2 cyber-glow">
                  <img
                    src={`http://localhost:5001${nft.image}`}
                    alt={`NFT ${nft.edition}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center" style={{ display: 'none' }}>
                    <span className="text-xs text-cyber-cyan-light">#{nft.edition}</span>
                  </div>
                </div>
                <p className="text-xs text-cyber-cyan">{nft.metadata.name}</p>
              </div>
            ))}
          </div>
          
          {generatedNFTs.length > 12 && (
            <p className="text-center text-sm text-cyber-cyan-light mt-4">
              Showing first 12 of {generatedNFTs.length} generated NFTs
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default NFTGenerator; 