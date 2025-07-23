const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  selectFile: () => ipcRenderer.invoke('select-file'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // App events
  onNewProject: (callback) => ipcRenderer.on('new-project', callback),
  onOpenProject: (callback) => ipcRenderer.on('open-project', callback),
  
  // API methods
  apiHealth: () => ipcRenderer.invoke('api-health'),
  apiUpload: (formData) => ipcRenderer.invoke('api-upload', formData),
  apiAuthLogin: (credentials) => ipcRenderer.invoke('api-auth-login', credentials),
  apiProjects: () => ipcRenderer.invoke('api-projects'),
  apiProjectsDelete: (params) => ipcRenderer.invoke('api-projects-delete', params),
  
  // Layer management
  apiLayersAssets: (params) => ipcRenderer.invoke('api-layers-assets', params),
  apiLayersOrder: (params) => ipcRenderer.invoke('api-layers-order', params),
  apiLayersRarity: (params) => ipcRenderer.invoke('api-layers-rarity', params),
  apiLayersDelete: (params) => ipcRenderer.invoke('api-layers-delete', params),
  
  // NFT Generation
  apiGenerateStatus: (params) => ipcRenderer.invoke('api-generate-status', params),
  apiGeneratePreview: (params) => ipcRenderer.invoke('api-generate-preview', params),
  apiGenerate: (params) => ipcRenderer.invoke('api-generate', params),
  apiDownload: (params) => ipcRenderer.invoke('api-download', params),
  
  // Rarity management
  apiRarity: (params) => ipcRenderer.invoke('api-rarity', params),
  apiRarityStats: (params) => ipcRenderer.invoke('api-rarity-stats', params),
  apiRarityUpdate: (params) => ipcRenderer.invoke('api-rarity-update', params),
  
  // Asset viewing
  apiLayersCompatibility: (params) => ipcRenderer.invoke('api-layers-compatibility', params),
  apiLayersCompatibilityAdd: (params) => ipcRenderer.invoke('api-layers-compatibility-add', params),
  apiLayersCompatibilityDelete: (params) => ipcRenderer.invoke('api-layers-compatibility-delete', params),
  apiAssetImage: (params) => ipcRenderer.invoke('api-asset-image', params),
  apiGeneratedImage: (params) => ipcRenderer.invoke('api-generated-image', params),
  
  // Project editing
  apiLayers: (params) => ipcRenderer.invoke('api-layers', params),
  apiDownloadStats: (params) => ipcRenderer.invoke('api-download-stats', params),
  
  // Canvas editing
  apiLayersSettings: (params) => ipcRenderer.invoke('api-layers-settings', params),
  apiLayersSettingsUpdate: (params) => ipcRenderer.invoke('api-layers-settings-update', params),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}); 