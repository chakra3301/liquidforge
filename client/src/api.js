const API_BASE = process.env.REACT_APP_API_URL.replace(/\/$/, ''); // Remove trailing slash

export async function getProjects() {
  const res = await fetch(`${API_BASE}/api/upload/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
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
    // credentials: 'include', // if you use cookies/auth
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

// Add more API functions as needed for your app 