const API_BASE = process.env.REACT_APP_API_URL.replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('token');
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  localStorage.setItem('token', data.token);
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
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/assets/${layerId}`, {
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
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/rarity/${layerId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    },
    body: JSON.stringify({ rarityPercentage })
  });
  if (!res.ok) throw new Error('Failed to update layer rarity');
  return res.json();
}

export async function deleteLayer(projectId, layerId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}/${layerId}`, {
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

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
} 