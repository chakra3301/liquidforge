import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Download, Eye, RotateCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import GeneratedNFTImage from './GeneratedNFTImage';
import { getProjects, getGenerationStatus, generatePreview, generateNFTs, downloadGenerated } from '../api';

const NFTGenerator = ({ projectId, project: propProject }) => {
  const [generationConfig, setGenerationConfig] = useState({
    count: 100,
    collectionName: 'My NFT Collection',
    description: 'Generated NFT collection',
    baseUrl: window.location.origin
  });
  const [generationStatus, setGenerationStatus] = useState(null);
  const [generatedNFTs, setGeneratedNFTs] = useState([]);
  const [previewNFTs, setPreviewNFTs] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  // Refs to prevent multiple simultaneous operations
  const generatingRef = useRef(false);
  const generatingPreviewRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Fetch project data if not provided as prop
  useEffect(() => {
    const fetchProject = async () => {
      if (!propProject && projectId) {
        try {
          console.log('Fetching project data for ID:', projectId);
          const response = await getProjects();
          const foundProject = response.projects.find(p => p.id.toString() === projectId.toString());
          if (foundProject && mountedRef.current) {
            setGenerationConfig(prev => ({
              ...prev,
              collectionName: foundProject.name || 'My NFT Collection'
            }));
            console.log('Project data loaded successfully');
          }
        } catch (error) {
          console.error('Error fetching project:', error);
          if (mountedRef.current) {
            toast.error('Failed to load project');
          }
        }
      }
    };

    fetchProject();
  }, [propProject, projectId]);

  const fetchGenerationStatus = useCallback(async () => {
    if (!projectId) return;
    
    try {
      console.log('Fetching generation status for project:', projectId);
      const response = await getGenerationStatus(projectId);
      if (mountedRef.current) {
        setGenerationStatus(response);
      }
    } catch (error) {
      console.error('Error fetching generation status:', error);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchGenerationStatus();
    }
  }, [projectId, fetchGenerationStatus]);

  const handleConfigChange = useCallback((field, value) => {
    setGenerationConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleGeneratePreview = useCallback(async () => {
    if (generatingPreviewRef.current) {
      console.log('Preview generation already in progress, skipping');
      return;
    }

    generatingPreviewRef.current = true;
    setGeneratingPreview(true);
    
    try {
      console.log('Starting preview generation for project:', projectId);
      const response = await generatePreview(projectId, 5);
      
      if (mountedRef.current) {
        setPreviewNFTs(response.nfts || []);
        setShowPreview(true);
        toast.success('Preview generated successfully!');
        console.log('Preview generation completed successfully');
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      if (mountedRef.current) {
        const errorMessage = error.message || 'Preview generation failed';
        toast.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setGeneratingPreview(false);
      }
      generatingPreviewRef.current = false;
    }
  }, [projectId]);

  const handleGenerate = useCallback(async () => {
    if (generatingRef.current) {
      console.log('Generation already in progress, skipping');
      return;
    }

    console.log('Generate button clicked');
    
    if (!generationConfig.count || generationConfig.count < 1 || generationConfig.count > 10000) {
      toast.error('Please enter a valid count between 1 and 10,000');
      return;
    }

    if (!generationConfig.collectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    generatingRef.current = true;
    console.log('Starting generation with config:', generationConfig);
    setGenerating(true);
    
    try {
      console.log('Calling apiGenerate...');
      const response = await generateNFTs(projectId, generationConfig);
      
      console.log('Generation response:', response);
      
      if (mountedRef.current) {
        toast.success(`Successfully generated ${generationConfig.count} NFTs!`);
        
        // Update state in a single batch to prevent multiple re-renders
        setGeneratedNFTs(response.nfts || []);
        setGenerationStatus(prev => ({
          ...prev,
          total_generated: response.nfts?.length || 0,
          max_edition: response.nfts?.length || 0
        }));
        
        console.log('Generation completed successfully');
      }
    } catch (error) {
      console.error('Generation error:', error);
      
      if (!mountedRef.current) return;
      
      // Check for overwrite error
      if (error.message?.includes('NFTs already exist for this project')) {
        if (window.confirm('NFTs already exist for this project. Overwrite?')) {
          try {
            console.log('Overwriting existing NFTs...');
            const response = await generateNFTs(projectId, { ...generationConfig, overwrite: true });
            
            console.log('Overwrite generation response:', response);
            
            if (mountedRef.current) {
              toast.success(`Successfully generated ${generationConfig.count} NFTs!`);
              
              // Update state in a single batch
              setGeneratedNFTs(response.nfts || []);
              setGenerationStatus(prev => ({
                ...prev,
                total_generated: response.nfts?.length || 0,
                max_edition: response.nfts?.length || 0
              }));
              
              console.log('Overwrite generation completed successfully');
            }
          } catch (err2) {
            console.error('Overwrite generation error:', err2);
            if (mountedRef.current) {
              const errorMessage2 = err2.message || 'Generation failed';
              toast.error(errorMessage2);
            }
          }
        } else {
          if (mountedRef.current) {
            toast('Generation cancelled.');
          }
        }
      } else {
        if (mountedRef.current) {
          const errorMessage = error.message || 'Generation failed';
          toast.error(errorMessage);
        }
      }
    } finally {
      console.log('Setting generating to false');
      if (mountedRef.current) {
        setGenerating(false);
      }
      generatingRef.current = false;
    }
  }, [projectId, generationConfig]);

  const handleDownload = useCallback(async (type) => {
    try {
      await downloadGenerated(projectId, type);

      toast.success(`${type.toUpperCase()} download started`);
    } catch (error) {
      toast.error('Download failed');
      console.error('Download error:', error);
    }
  }, [projectId]);

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
                <div className="text-center p-3 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
                  <div className="text-2xl font-bold text-cyber-cyan">{generationStatus.total_generated || 0}</div>
                  <div className="text-sm text-cyber-cyan-light">Total Generated</div>
                </div>
                <div className="text-center p-3 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
                  <div className="text-2xl font-bold text-cyber-cyan">{generationStatus.max_edition || 0}</div>
                  <div className="text-sm text-cyber-cyan-light">Max Edition</div>
                </div>
              </div>
              
              {generationStatus.total_generated > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyber-cyan">Download Generated NFTs</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload('images')}
                        className="cyber-button-small flex items-center space-x-1 px-3 py-1 rounded text-xs"
                      >
                        <Download size={12} />
                        <span>Images</span>
                      </button>
                      <button
                        onClick={() => handleDownload('metadata')}
                        className="cyber-button-small flex items-center space-x-1 px-3 py-1 rounded text-xs"
                      >
                        <Download size={12} />
                        <span>Metadata</span>
                      </button>
                      <button
                        onClick={() => handleDownload('all')}
                        className="cyber-button-small flex items-center space-x-1 px-3 py-1 rounded text-xs"
                      >
                        <Download size={12} />
                        <span>All</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <RotateCcw className="h-8 w-8 text-cyber-cyan-light mx-auto mb-2" />
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
              <div key={nft.id} className="text-center">
                <div className="w-full aspect-square bg-cyber-gray border border-cyber-cyan rounded-lg overflow-hidden mb-2 cyber-glow">
                  <GeneratedNFTImage
                    projectId={projectId}
                    imageFileName={nft.image}
                    alt={`Preview ${nft.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-cyber-cyan font-medium">#{nft.id}</p>
                <div className="text-xs text-cyber-cyan-light mt-1">
                  {nft.attributes?.length || 0} layers
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
              <div key={nft.id} className="text-center">
                <div className="w-full aspect-square bg-cyber-gray border border-cyber-cyan rounded-lg overflow-hidden mb-2 cyber-glow">
                  <GeneratedNFTImage
                    projectId={projectId}
                    imageFileName={nft.image}
                    alt={`NFT ${nft.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-cyber-cyan">{nft.name}</p>
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