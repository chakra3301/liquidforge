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
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
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
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/layers/${layerId}/rarity`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ rarity_percentage: rarityPercentage })
  });
  if (!res.ok) throw new Error('Failed to update layer rarity');
  return res.json();
}

export async function deleteLayer(projectId, layerId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/layers/${layerId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete layer');
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
  const res = await fetch(`${API_BASE}/api/generate/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ config })
  });
  if (!res.ok) throw new Error('Failed to generate NFTs');
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
  const res = await fetch(`${API_BASE}/api/generated/${projectId}/${encodeURIComponent(imageFileName)}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch generated image');
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
  console.log('Upload request - API URL:', `${API_BASE}/api/upload`);

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
    throw new Error('Upload failed');
  }
  
  return res.json();
} 