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

export async function getLayers(projectId) {
  const res = await fetch(`${API_BASE}/api/layers/${projectId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch layers');
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