const API_BASE = process.env.REACT_APP_API_URL.replace(/\/$/, '');

function getToken() {
  const token = localStorage.getItem('token');
  console.log('getToken - Token from localStorage:', token ? 'Present' : 'Missing');
  if (token) {
    console.log('getToken - Token length:', token.length);
    console.log('getToken - Token starts with:', token.substring(0, 20) + '...');
  }
  if (!token) {
    console.warn('No authentication token found');
  }
  return token;
}

export async function login(email, password) {
  console.log('Login attempt for email:', email);
  console.log('Login API URL:', `${API_BASE}/api/auth/login`);
  
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  console.log('Login response status:', res.status);
  console.log('Login response headers:', Object.fromEntries(res.headers.entries()));
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Login error response:', errorText);
    throw new Error('Login failed');
  }
  
  const data = await res.json();
  console.log('Login - Received token:', data.token ? 'Present' : 'Missing');
  if (data.token) {
    console.log('Login - Token length:', data.token.length);
    console.log('Login - Token starts with:', data.token.substring(0, 20) + '...');
  }
  localStorage.setItem('token', data.token);
  console.log('Login - Token stored in localStorage');
  return data;
}

export async function register(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Registration failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
  console.log('Token cleared from localStorage');
}

// Debug function to clear token and reload
export function debugClearToken() {
  localStorage.removeItem('token');
  console.log('Token cleared from localStorage');
  console.log('Please refresh the page and log in again');
  window.location.reload();
}

// Debug function to show current token info
export function debugTokenInfo() {
  const token = localStorage.getItem('token');
  console.log('Current token:', token ? 'Present' : 'Missing');
  if (token) {
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    console.log('Token ends with:', '...' + token.substring(token.length - 20));
  }
}

// Debug function to test token validity
export async function debugTestToken() {
  const token = getToken();
  console.log('Testing token validity...');
  console.log('Token:', token ? 'Present' : 'Missing');
  
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Token test response status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('Token test response:', data);
      console.log('Token is VALID');
    } else {
      const errorText = await res.text();
      console.log('Token test error:', errorText);
      console.log('Token is INVALID');
    }
  } catch (error) {
    console.error('Token test failed:', error);
  }
}

// Make debug functions available globally for console access
if (typeof window !== 'undefined') {
  window.debugClearToken = debugClearToken;
  window.debugTokenInfo = debugTokenInfo;
  window.debugTestToken = debugTestToken;
  console.log('Debug functions available: debugClearToken(), debugTokenInfo(), debugTestToken()');
}

export async function getProjects() {
  const res = await fetch(`${API_BASE}/api/upload/projects`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function deleteProject(projectId) {
  const res = await fetch(`${API_BASE}/api/upload/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

export async function getLayers(projectId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch layers');
  return res.json();
}

export async function getLayerAssets(projectId, layerId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/${layerId}/assets`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch layer assets');
  return res.json();
}

export async function updateLayerOrder(projectId, layers) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/order`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ layers })
  });
  if (!res.ok) throw new Error('Failed to update layer order');
  return res.json();
}

export async function updateLayerRarity(projectId, layerId, rarityPercentage) {
  const token = getToken();
  console.log('updateLayerRarity - Token:', token ? 'Present' : 'Missing');
  console.log('updateLayerRarity - URL:', `${API_BASE}/api/layers/${projectId}/layers/${layerId}/rarity`);
  console.log('updateLayerRarity - Data:', { rarity_percentage: rarityPercentage });
  
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/layers/${layerId}/rarity`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ rarity_percentage: rarityPercentage })
  });
  
  console.log('updateLayerRarity - Response status:', res.status);
  if (!res.ok) {
    const errorText = await res.text();
    console.error('updateLayerRarity - Error response:', errorText);
    throw new Error('Failed to update layer rarity');
  }
  return res.json();
}

export async function deleteLayer(projectId, layerId) {
  const token = getToken();
  console.log('deleteLayer - Token:', token ? 'Present' : 'Missing');
  console.log('deleteLayer - URL:', `${API_BASE}/api/layers/${projectId}/layers/${layerId}`);
  
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/layers/${layerId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('deleteLayer - Response status:', res.status);
  if (!res.ok) {
    const errorText = await res.text();
    console.error('deleteLayer - Error response:', errorText);
    throw new Error('Failed to delete layer');
  }
  return res.json();
}

export async function getLayerSettings(projectId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/settings`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch layer settings');
  return res.json();
}

export async function updateLayerSettings(projectId, settings) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ settings })
  });
  if (!res.ok) throw new Error('Failed to update layer settings');
  return res.json();
}

export async function getRarityData(projectId) {
  const res = await fetch(`${API_BASE}/api/rarity/${projectId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch rarity data');
  return res.json();
}

export async function getRarityStats(projectId) {
  const res = await fetch(`${API_BASE}/api/rarity/${projectId}/stats`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch rarity stats');
  return res.json();
}

export async function updateRarity(projectId, rarity) {
  const res = await fetch(`${API_BASE}/api/rarity/${projectId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ rarity })
  });
  if (!res.ok) throw new Error('Failed to update rarity');
  return res.json();
}

export async function getGenerationStatus(projectId) {
  const res = await fetch(`${API_BASE}/api/generate/${projectId}/status`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch generation status');
  return res.json();
}

export async function generatePreview(projectId, count = 5) {
  const res = await fetch(`${API_BASE}/api/generate/${projectId}/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ count })
  });
  if (!res.ok) throw new Error('Failed to generate preview');
  return res.json();
}

export async function generateNFTs(projectId, config) {
  const token = getToken();
  console.log('generateNFTs - Token:', token ? 'Present' : 'Missing');
  console.log('generateNFTs - Project ID:', projectId);
  console.log('generateNFTs - Config:', config);
  console.log('generateNFTs - Request body:', config);
  
  const res = await fetch(`${API_BASE}/api/generate/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(config)
  });
  
  console.log('generateNFTs - Response status:', res.status);
  if (!res.ok) {
    const errorText = await res.text();
    console.error('generateNFTs - Error response:', errorText);
    
    // Try to parse the error response as JSON
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { error: errorText };
    }
    
    // Create a custom error with the server's error message
    const error = new Error(errorData.error || 'Failed to generate NFTs');
    error.status = res.status;
    error.data = errorData;
    throw error;
  }
  return res.json();
}

export async function downloadGenerated(projectId, type) {
  const res = await fetch(`${API_BASE}/api/download/${projectId}/${type}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to download');
  return res.json();
}

export async function getDownloadStats(projectId) {
  const res = await fetch(`${API_BASE}/api/download/${projectId}/stats`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch download stats');
  return res.json();
}

export async function getAssetImage(projectId, assetPath) {
  const res = await fetch(`${API_BASE}/api/assets/${projectId}/${encodeURIComponent(assetPath)}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch asset image');
  const blob = await res.blob();
  return { data: URL.createObjectURL(blob) };
}

export async function getGeneratedImage(projectId, imageFileName) {
  // For preview images, we need to preserve the subdirectory structure
  // For final images, we just need the filename
  let pathToUse;
  if (imageFileName.includes('/preview-')) {
    // This is a preview image, keep the full path after /generated/
    pathToUse = imageFileName.replace('/generated/', '');
  } else {
    // This is a final image, just use the filename
    pathToUse = imageFileName.split('/').pop();
  }
  
  console.log('getGeneratedImage - Original path:', imageFileName);
  console.log('getGeneratedImage - Path to use:', pathToUse);
  
  const res = await fetch(`${API_BASE}/api/generated/${projectId}/${encodeURIComponent(pathToUse)}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  
  console.log('getGeneratedImage - URL:', `${API_BASE}/api/generated/${projectId}/${encodeURIComponent(pathToUse)}`);
  console.log('getGeneratedImage - Response status:', res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('getGeneratedImage - Error response:', errorText);
    throw new Error('Failed to fetch generated image');
  }
  
  const blob = await res.blob();
  return { data: URL.createObjectURL(blob) };
}

export async function getCompatibilityRules(projectId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/compatibility`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch compatibility rules');
  return res.json();
}

export async function addCompatibilityRule(projectId, asset1Id, asset2Id) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/compatibility`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ asset1Id, asset2Id })
  });
  if (!res.ok) throw new Error('Failed to add compatibility rule');
  return res.json();
}

export async function deleteCompatibilityRule(projectId, ruleId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/compatibility/${ruleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete compatibility rule');
  return res.json();
}

export async function uploadProject({ file, projectName, description }) {
  const formData = new FormData();
  formData.append('zipFile', file);
  formData.append('projectName', projectName);
  formData.append('description', description);

  const token = getToken();
  console.log('Upload request - Token:', token ? 'Present' : 'Missing');
  console.log('Upload request - Token length:', token ? token.length : 0);
  console.log('Upload request - Token starts with:', token ? token.substring(0, 20) + '...' : 'Missing');
  console.log('Upload request - Token ends with:', token ? '...' + token.substring(token.length - 20) : 'Missing');
  console.log('Upload request - API URL:', `${API_BASE}/api/upload`);
  console.log('Upload request - Authorization header:', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('Upload response status:', res.status);
  console.log('Upload response headers:', Object.fromEntries(res.headers.entries()));
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Upload error response:', errorText);
    console.error('Upload error response length:', errorText.length);
    throw new Error('Upload failed');
  }
  
  return res.json();
} 