import React, { useState, useEffect, useCallback } from 'react';
import { Save, RotateCcw, Move } from 'lucide-react';
import toast from 'react-hot-toast';

const CanvasEditor = ({ projectId }) => {
  const [settings, setSettings] = useState({
    canvas_width: 1000,
    canvas_height: 1000,
    background_color: '#ffffff'
  });
  const [layers, setLayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCanvasData = useCallback(async () => {
    try {
      const [settingsRes, layersRes] = await Promise.all([
        window.electronAPI.apiLayersSettings({ projectId }),
        window.electronAPI.apiLayers({ projectId })
      ]);
      
      setSettings(settingsRes.settings);
      setLayers(layersRes.layers);
    } catch (error) {
      toast.error('Failed to load canvas data');
      console.error('Error fetching canvas data:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCanvasData();
  }, [fetchCanvasData]);

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await window.electronAPI.apiLayersSettingsUpdate({
        projectId,
        settings
      });
      toast.success('Canvas settings saved');
    } catch (error) {
      toast.error('Failed to save canvas settings');
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas Settings */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvas Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="form-label">Canvas Width</label>
              <input
                type="number"
                value={settings.canvas_width}
                onChange={(e) => handleSettingsChange('canvas_width', parseInt(e.target.value))}
                className="form-input"
                min="100"
                max="4000"
              />
            </div>

            <div>
              <label className="form-label">Canvas Height</label>
              <input
                type="number"
                value={settings.canvas_height}
                onChange={(e) => handleSettingsChange('canvas_height', parseInt(e.target.value))}
                className="form-input"
                min="100"
                max="4000"
              />
            </div>

            <div>
              <label className="form-label">Background Color</label>
              <input
                type="color"
                value={settings.background_color}
                onChange={(e) => handleSettingsChange('background_color', e.target.value)}
                className="form-input h-12"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Canvas Preview</h3>
            
            <div className="relative">
              <div
                className="border-2 border-gray-300 rounded-lg overflow-hidden"
                style={{
                  width: Math.min(400, settings.canvas_width),
                  height: Math.min(400, settings.canvas_height),
                  backgroundColor: settings.background_color,
                  transform: `scale(${Math.min(400 / settings.canvas_width, 400 / settings.canvas_height)})`,
                  transformOrigin: 'top left'
                }}
              >
                {/* Canvas content would be rendered here */}
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Move size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Canvas Preview</p>
                    <p className="text-xs">{settings.canvas_width} × {settings.canvas_height}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p>Canvas dimensions: {settings.canvas_width} × {settings.canvas_height} pixels</p>
              <p>Background: {settings.background_color}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Transformations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Layer Transformations</h3>
        
        <div className="space-y-4">
          {layers.map((layer) => (
            <div key={layer.id} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">{layer.name}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="form-label text-xs">Position X</label>
                  <input
                    type="number"
                    className="form-input text-sm"
                    placeholder="0"
                    onChange={(e) => {
                      // Handle position X change
                    }}
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Position Y</label>
                  <input
                    type="number"
                    className="form-input text-sm"
                    placeholder="0"
                    onChange={(e) => {
                      // Handle position Y change
                    }}
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Scale</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    className="form-input text-sm"
                    placeholder="1.0"
                    onChange={(e) => {
                      // Handle scale change
                    }}
                  />
                </div>
                
                <div>
                  <label className="form-label text-xs">Rotation</label>
                  <input
                    type="number"
                    step="1"
                    className="form-input text-sm"
                    placeholder="0"
                    onChange={(e) => {
                      // Handle rotation change
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Transformation Controls</h4>
              <p className="text-sm text-blue-700 mt-1">
                Adjust position, scale, and rotation for each layer. These transformations will be applied to all assets in the layer during NFT generation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasEditor; 