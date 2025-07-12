import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Grid, List, Download, X, Plus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageModal from './ImageModal';

const AssetViewer = ({ projectId, layers }) => {
  const [layerAssets, setLayerAssets] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedLayer, setSelectedLayer] = useState('all');
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState('viewer'); // 'viewer' or 'compatibility'
  const [compatibilityRules, setCompatibilityRules] = useState([]);
  const [selectedAsset1, setSelectedAsset1] = useState(null);
  const [selectedAsset2, setSelectedAsset2] = useState(null);

  useEffect(() => {
    fetchLayerAssets();
  }, [layers]);

  const fetchLayerAssets = async () => {
    try {
      const assetPromises = layers.map(layer =>
        axios.get(`/api/layers/${projectId}/${layer.id}/assets`)
      );
      
      const responses = await Promise.all(assetPromises);
      const assetsMap = {};
      
      responses.forEach((response, index) => {
        assetsMap[layers[index].id] = response.data.assets;
      });
      
      setLayerAssets(assetsMap);
    } catch (error) {
      toast.error('Failed to load layer assets');
      console.error('Error fetching layer assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAllAssets = () => {
    const allAssets = [];
    Object.entries(layerAssets).forEach(([layerId, assets]) => {
      const layer = layers.find(l => l.id === parseInt(layerId));
      assets.forEach(asset => {
        allAssets.push({
          ...asset,
          layerName: layer ? layer.name : 'Unknown'
        });
      });
    });
    return allAssets;
  };

  const getFilteredAssets = () => {
    let assets = getAllAssets();
    
    // Filter by layer
    if (selectedLayer !== 'all') {
      const layer = layers.find(l => l.id === parseInt(selectedLayer));
      if (layer) {
        assets = assets.filter(asset => asset.layerName === layer.name);
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      assets = assets.filter(asset => 
        asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.layerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return assets;
  };

  const handleDownloadAsset = (asset) => {
    const link = document.createElement('a');
    link.href = `/api/assets/${projectId}/${asset.file_path}`;
    link.download = asset.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${asset.filename}`);
  };

  const handleImageClick = (asset) => {
    setSelectedImage({
      ...asset,
      projectId: projectId
    });
  };

  const fetchCompatibilityRules = async () => {
    try {
      const response = await axios.get(`/api/layers/${projectId}/compatibility`);
      setCompatibilityRules(response.data.compatibility_rules);
    } catch (error) {
      toast.error('Failed to load compatibility rules');
      console.error('Error fetching compatibility rules:', error);
    }
  };

  const addCompatibilityRule = async () => {
    if (!selectedAsset1 || !selectedAsset2) {
      toast.error('Please select two assets');
      return;
    }

    if (selectedAsset1.id === selectedAsset2.id) {
      toast.error('Cannot make an asset incompatible with itself');
      return;
    }

    try {
      await axios.post(`/api/layers/${projectId}/compatibility`, {
        asset_id: selectedAsset1.id,
        incompatible_asset_id: selectedAsset2.id
      });
      
      toast.success('Compatibility rule added');
      fetchCompatibilityRules();
      setSelectedAsset1(null);
      setSelectedAsset2(null);
    } catch (error) {
      toast.error('Failed to add compatibility rule');
      console.error('Error adding compatibility rule:', error);
    }
  };

  const deleteCompatibilityRule = async (ruleId) => {
    try {
      await axios.delete(`/api/layers/${projectId}/compatibility/${ruleId}`);
      toast.success('Compatibility rule deleted');
      fetchCompatibilityRules();
    } catch (error) {
      toast.error('Failed to delete compatibility rule');
      console.error('Error deleting compatibility rule:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'compatibility') {
      fetchCompatibilityRules();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan cyber-glow"></div>
      </div>
    );
  }

  const filteredAssets = getFilteredAssets();

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-cyber-cyan cyber-glow">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('viewer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
              activeTab === 'viewer'
                ? 'border-cyber-cyan text-cyber-cyan cyber-text'
                : 'border-transparent text-cyber-cyan-light hover:text-cyber-cyan hover:border-cyber-cyan'
            }`}
          >
            Asset Viewer
          </button>
          <button
            onClick={() => setActiveTab('compatibility')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
              activeTab === 'compatibility'
                ? 'border-cyber-cyan text-cyber-cyan cyber-text'
                : 'border-transparent text-cyber-cyan-light hover:text-cyber-cyan hover:border-cyber-cyan'
            }`}
          >
            Compatibility Rules
          </button>
        </nav>
      </div>

      {activeTab === 'viewer' && (
        <div className="cyber-card p-6 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-cyber-cyan cyber-text">Asset Viewer</h3>
              <p className="text-sm text-cyber-cyan-light">
                View and manage all uploaded images ({filteredAssets.length} assets)
              </p>
            </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyber-cyan" size={16} />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cyber-input pl-10 pr-4 py-2 rounded-lg"
              />
            </div>
            
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="cyber-input px-3 py-2 rounded-lg"
            >
              <option value="all">All Layers</option>
              {layers.map(layer => (
                <option key={layer.id} value={layer.id}>{layer.name}</option>
              ))}
            </select>
            
            <div className="flex border border-cyber-cyan rounded-lg cyber-glow">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-cyber-cyan text-cyber-black' : 'bg-cyber-dark text-cyber-cyan'}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-cyber-cyan text-cyber-black' : 'bg-cyber-dark text-cyber-cyan'}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-cyber-cyan mb-4 cyber-glow">
              <Search size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-cyber-cyan cyber-text mb-2">No assets found</h3>
            <p className="text-cyber-cyan-light">
              {searchTerm || selectedLayer !== 'all' 
                ? 'Try adjusting your search or layer filter'
                : 'No assets have been uploaded yet'
              }
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 'space-y-2'}>
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                className={`bg-cyber-dark border border-cyber-cyan rounded-lg overflow-hidden hover:cyber-glow-strong transition-all duration-300 cyber-glow ${
                  viewMode === 'list' ? 'flex items-center p-3' : ''
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="aspect-square bg-cyber-gray relative group cursor-pointer" onClick={() => handleImageClick(asset)}>
                      <img
                        src={`/api/assets/${projectId}/${asset.file_path}`}
                        alt={asset.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="absolute inset-0 bg-cyber-gray flex items-center justify-center" style={{display: 'none'}}>
                        <span className="text-xs text-cyber-cyan-light text-center px-2">
                          {asset.filename.split('.')[0]}
                        </span>
                      </div>
                      
                      <div className="absolute inset-0 bg-cyber-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadAsset(asset);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-cyber-cyan text-cyber-black p-2 rounded-full hover:bg-cyber-cyan-light cyber-glow"
                          title="Download asset"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-cyber-cyan truncate" title={asset.filename}>
                        {asset.filename}
                      </p>
                      <p className="text-xs text-cyber-cyan-light">{asset.layerName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-cyber-gray rounded flex-shrink-0 mr-3 cursor-pointer" onClick={() => handleImageClick(asset)}>
                      <img
                        src={`/api/assets/${projectId}/${asset.file_path}`}
                        alt={asset.filename}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center bg-cyber-gray rounded" style={{display: 'none'}}>
                        <span className="text-xs text-cyber-cyan-light text-center px-1">
                          {asset.filename.split('.')[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-cyber-cyan truncate" title={asset.filename}>
                        {asset.filename}
                      </p>
                      <p className="text-xs text-cyber-cyan-light">{asset.layerName}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadAsset(asset);
                      }}
                      className="p-2 text-cyber-cyan hover:text-cyber-cyan-light"
                      title="Download asset"
                    >
                      <Download size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {activeTab === 'compatibility' && (
        <div className="cyber-card p-6 rounded-lg">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-cyber-cyan cyber-text mb-2">Asset Compatibility Rules</h3>
            <p className="text-sm text-cyber-cyan-light">
              Define which assets cannot appear together in generated NFTs. This helps prevent unrealistic combinations.
            </p>
          </div>

          {/* Add New Rule */}
          <div className="bg-cyber-gray border border-cyber-cyan p-4 rounded-lg mb-6 cyber-glow">
            <h4 className="font-medium text-cyber-cyan cyber-text mb-3">Add New Incompatibility Rule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-cyber-cyan mb-2">First Asset</label>
                <select
                  value={selectedAsset1?.id || ''}
                  onChange={(e) => {
                    const asset = getAllAssets().find(a => a.id === parseInt(e.target.value));
                    setSelectedAsset1(asset || null);
                  }}
                  className="cyber-input w-full px-3 py-2 rounded-lg"
                >
                  <option value="">Select an asset...</option>
                  {getAllAssets().map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.filename} ({asset.layerName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-cyber-cyan mb-2">Incompatible Asset</label>
                <select
                  value={selectedAsset2?.id || ''}
                  onChange={(e) => {
                    const asset = getAllAssets().find(a => a.id === parseInt(e.target.value));
                    setSelectedAsset2(asset || null);
                  }}
                  className="cyber-input w-full px-3 py-2 rounded-lg"
                >
                  <option value="">Select an asset...</option>
                  {getAllAssets().map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.filename} ({asset.layerName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={addCompatibilityRule}
              disabled={!selectedAsset1 || !selectedAsset2}
              className="cyber-button flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>Add Rule</span>
            </button>
          </div>

          {/* Existing Rules */}
          <div>
            <h4 className="font-medium text-cyber-cyan cyber-text mb-3">Existing Rules ({compatibilityRules.length})</h4>
            {compatibilityRules.length === 0 ? (
              <div className="text-center py-8 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
                <AlertTriangle className="mx-auto h-12 w-12 text-cyber-cyan mb-4 cyber-glow" />
                <h3 className="text-lg font-medium text-cyber-cyan cyber-text mb-2">No compatibility rules</h3>
                <p className="text-cyber-cyan-light">Add rules to prevent certain assets from appearing together.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {compatibilityRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-cyber-dark border border-cyber-cyan rounded-lg cyber-glow">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-cyber-cyan">{rule.asset_filename}</span>
                        <span className="text-xs text-cyber-cyan-light">({rule.asset_layer_name})</span>
                      </div>
                      <X size={16} className="text-cyber-cyan" />
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-cyber-cyan">{rule.incompatible_filename}</span>
                        <span className="text-xs text-cyber-cyan-light">({rule.incompatible_layer_name})</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCompatibilityRule(rule.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-cyber-gray rounded transition-colors"
                      title="Delete rule"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDownload={() => handleDownloadAsset(selectedImage)}
        />
      )}
    </div>
  );
};

export default AssetViewer; 