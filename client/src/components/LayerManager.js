import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { GripVertical, Eye, EyeOff, Settings, Move, ChevronUp, ChevronDown, Percent, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const LayerManager = ({ projectId, layers, onLayersUpdate }) => {
  const [layerAssets, setLayerAssets] = useState({});
  const [loading, setLoading] = useState(true);

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

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(layers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update z-index values
    const updatedLayers = items.map((item, index) => ({
      ...item,
      z_index: index
    }));

    try {
      console.log('Updating layer order:', updatedLayers);
      await axios.put(`/api/layers/${projectId}/order`, {
        layers: updatedLayers
      });
      
      onLayersUpdate();
      toast.success('Layer order updated successfully');
    } catch (error) {
      toast.error('Failed to update layer order');
      console.error('Error updating layer order:', error);
    }
  };

  const moveLayer = async (layerId, direction) => {
    const currentIndex = layers.findIndex(layer => layer.id === layerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const items = Array.from(layers);
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(newIndex, 0, movedItem);

    // Update z-index values
    const updatedLayers = items.map((item, index) => ({
      ...item,
      z_index: index
    }));

    try {
      await axios.put(`/api/layers/${projectId}/order`, {
        layers: updatedLayers
      });
      
      onLayersUpdate();
      toast.success(`Layer moved ${direction}`);
    } catch (error) {
      toast.error('Failed to move layer');
      console.error('Error moving layer:', error);
    }
  };

  const updateLayerRarity = async (layerId, rarityPercentage) => {
    try {
      await axios.put(`/api/layers/${projectId}/layers/${layerId}/rarity`, {
        rarity_percentage: rarityPercentage
      });
      
      onLayersUpdate();
      toast.success('Layer rarity updated');
    } catch (error) {
      toast.error('Failed to update layer rarity');
      console.error('Error updating layer rarity:', error);
    }
  };

  const deleteLayer = async (layerId, layerName) => {
    if (!window.confirm(`Are you sure you want to delete the layer "${layerName}"? This will also delete all assets in this layer and cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/layers/${projectId}/layers/${layerId}`);
      
      onLayersUpdate();
      toast.success(`Layer "${layerName}" deleted successfully`);
    } catch (error) {
      toast.error('Failed to delete layer');
      console.error('Error deleting layer:', error);
    }
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
        <h3 className="text-lg font-semibold text-cyber-cyan cyber-text mb-4">Layer Management</h3>
        <p className="text-sm text-cyber-cyan-light mb-6">
          Drag and drop layers using the grip handle, or use the up/down arrows to reorder them. 
          Layers at the top will appear behind layers below in the final NFT.
          Adjust layer rarity (0-100%) to control how often each layer appears in generated NFTs. 
          Layers with less than 100% rarity may not appear in every generated NFT.
        </p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {layers.map((layer, index) => (
                  <Draggable key={layer.id} draggableId={layer.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 border border-cyber-cyan rounded-lg bg-cyber-dark transition-all duration-200 cyber-glow ${
                          snapshot.isDragging 
                            ? 'cyber-glow-strong transform rotate-2 scale-105' 
                            : 'hover:cyber-glow-strong'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              {...provided.dragHandleProps}
                              className="text-cyber-cyan hover:text-cyber-cyan-light cursor-grab active:cursor-grabbing p-1 rounded hover:bg-cyber-gray transition-colors"
                              title="Drag to reorder layer"
                            >
                              <GripVertical size={20} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-cyber-cyan cyber-text">{layer.name}</h4>
                                {(layer.rarity_percentage || 100) < 100 && (
                                  <span className="text-xs bg-cyber-gray border border-cyber-cyan text-cyber-cyan px-2 py-1 rounded-full cyber-glow">
                                    Rare
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-cyber-cyan-light">
                                {layerAssets[layer.id]?.length || 0} assets • Z-index: {layer.z_index}
                              </p>
                              <div className="mt-2 flex items-center space-x-2">
                                <Percent size={12} className="text-cyber-cyan" />
                                <span className="text-xs text-cyber-cyan-light">Rarity:</span>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={layer.rarity_percentage || 100}
                                  onChange={(e) => updateLayerRarity(layer.id, parseFloat(e.target.value))}
                                  className="flex-1 h-2 bg-cyber-gray rounded-lg appearance-none cursor-pointer slider"
                                />
                                <span className={`text-xs font-medium min-w-[3rem] ${
                                  (layer.rarity_percentage || 100) < 100 
                                    ? 'text-cyber-cyan' 
                                    : 'text-cyber-cyan-light'
                                }`}>
                                  {layer.rarity_percentage || 100}%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-cyber-cyan bg-cyber-gray border border-cyber-cyan px-2 py-1 rounded cyber-glow">
                              Position {layer.z_index + 1}
                            </div>
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => moveLayer(layer.id, 'up')}
                                disabled={layer.z_index === 0}
                                className="p-1 text-cyber-cyan hover:text-cyber-cyan-light disabled:text-cyber-gray disabled:cursor-not-allowed"
                                title="Move layer up"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                onClick={() => moveLayer(layer.id, 'down')}
                                disabled={layer.z_index === layers.length - 1}
                                className="p-1 text-cyber-cyan hover:text-cyber-cyan-light disabled:text-cyber-gray disabled:cursor-not-allowed"
                                title="Move layer down"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>
                            <button
                              className="p-2 text-cyber-cyan hover:text-cyber-cyan-light"
                              title="Layer visibility"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-2 text-cyber-cyan hover:text-cyber-cyan-light"
                              title="Layer settings"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => deleteLayer(layer.id, layer.name)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-cyber-gray rounded transition-colors"
                              title="Delete layer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Asset preview */}
                        {layerAssets[layer.id] && layerAssets[layer.id].length > 0 && (
                          <div className="mt-3 pt-3 border-t border-cyber-cyan">
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                              {layerAssets[layer.id].slice(0, 8).map((asset) => (
                                <div
                                  key={asset.id}
                                  className="flex-shrink-0 w-16 h-16 bg-cyber-gray border border-cyber-cyan rounded overflow-hidden cyber-glow"
                                  title={asset.filename}
                                >
                                  <img
                                    src={`/api/assets/${projectId}/${asset.file_path}`}
                                    alt={asset.filename}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      e.target.nextSibling.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-full h-full flex items-center justify-center bg-cyber-gray" style={{display: 'none'}}>
                                    <span className="text-xs text-cyber-cyan-light text-center px-1">
                                      {asset.filename.split('.')[0]}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {layerAssets[layer.id].length > 8 && (
                                <div className="flex-shrink-0 w-16 h-16 bg-cyber-gray border border-cyber-cyan rounded flex items-center justify-center cyber-glow">
                                  <span className="text-xs text-cyber-cyan-light">
                                    +{layerAssets[layer.id].length - 8}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default LayerManager; 