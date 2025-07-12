import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, BarChart3, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const RarityManager = ({ projectId, layers }) => {
  const [rarityData, setRarityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchRarityData();
  }, [projectId]);

  const fetchRarityData = async () => {
    try {
      const [rarityRes, statsRes] = await Promise.all([
        axios.get(`/api/rarity/${projectId}`),
        axios.get(`/api/rarity/${projectId}/stats`)
      ]);
      
      setRarityData(rarityRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load rarity data');
      console.error('Error fetching rarity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRarityChange = (layerId, assetId, value) => {
    setRarityData(prev => ({
      ...prev,
      layers: prev.layers.map(layer => {
        if (layer.id === layerId) {
          return {
            ...layer,
            assets: layer.assets.map(asset => {
              if (asset.id === assetId) {
                return { ...asset, rarity_weight: parseFloat(value) || 0 };
              }
              return asset;
            })
          };
        }
        return layer;
      })
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allAssets = [];
      rarityData.layers.forEach(layer => {
        layer.assets.forEach(asset => {
          allAssets.push({
            id: asset.id,
            rarity_weight: asset.rarity_weight
          });
        });
      });

      await axios.put(`/api/rarity/${projectId}`, {
        assets: allAssets
      });

      toast.success('Rarity weights saved successfully');
      fetchRarityData(); // Refresh data
    } catch (error) {
      toast.error('Failed to save rarity weights');
      console.error('Error saving rarity weights:', error);
    } finally {
      setSaving(false);
    }
  };

  const calculateTotalWeight = (assets) => {
    return assets.reduce((sum, asset) => sum + asset.rarity_weight, 0);
  };

  const calculatePercentage = (weight, total) => {
    if (total === 0) return 0;
    return ((weight / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-cyan cyber-glow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="cyber-card p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-cyber-cyan cyber-text">Rarity Management</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="cyber-button flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        <div className="bg-cyber-gray border border-cyber-cyan rounded-lg p-4 mb-6 cyber-glow">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-cyber-cyan mt-0.5 cyber-glow" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-cyber-cyan cyber-text">Rarity Weights</h3>
              <p className="text-sm text-cyber-cyan-light mt-1">
                Set the rarity weight for each asset. Higher weights mean the asset will appear more frequently in generated NFTs.
              </p>
            </div>
          </div>
        </div>

        {rarityData.layers?.map((layer) => {
          const totalWeight = calculateTotalWeight(layer.assets);
          
          return (
            <div key={layer.id} className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-cyber-cyan cyber-text">{layer.name}</h4>
                <div className="text-sm text-cyber-cyan-light">
                  Total Weight: {totalWeight.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {layer.assets.map((asset) => {
                  const percentage = calculatePercentage(asset.rarity_weight, totalWeight);
                  
                  return (
                    <div key={asset.id} className="border border-cyber-cyan rounded-lg p-4 bg-cyber-gray cyber-glow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium text-cyber-cyan text-sm">
                            {asset.filename}
                          </h5>
                          <p className="text-xs text-cyber-cyan-light">
                            {percentage}% chance
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={asset.rarity_weight}
                            onChange={(e) => handleRarityChange(layer.id, asset.id, e.target.value)}
                            className="cyber-input flex-1 text-sm"
                            placeholder="Weight"
                          />
                        </div>

                        <div className="w-full bg-cyber-dark rounded-full h-2">
                          <div
                            className="bg-cyber-cyan h-2 rounded-full transition-all duration-200 cyber-glow"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {stats && (
          <div className="mt-8 p-4 bg-cyber-gray border border-cyber-cyan rounded-lg cyber-glow">
            <h4 className="font-medium text-cyber-cyan cyber-text mb-3 flex items-center">
              <BarChart3 size={16} className="mr-2" />
              Rarity Statistics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.stats?.map((stat) => (
                <div key={stat.layer_name} className="text-sm">
                  <div className="font-medium text-cyber-cyan">{stat.layer_name}</div>
                  <div className="text-cyber-cyan-light">
                    Assets: {stat.total_assets} | 
                    Avg Weight: {stat.avg_weight?.toFixed(2) || '0'} |
                    Range: {stat.min_weight?.toFixed(2) || '0'} - {stat.max_weight?.toFixed(2) || '0'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RarityManager; 