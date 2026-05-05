const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && ['localhost', '127.0.0.1'].includes(window.location.hostname);
const DEFAULT_API_URL = isLocalhost ? 'http://localhost:4000/api' : 'https://autopartiq.onrender.com/api';
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

export async function api(path, { method = 'GET', body, token } = {}) {
  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (error) {
    throw new Error(`Failed to reach API at ${API_URL}. ${error.message}`);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API request failed with status ${res.status}`);
  }

  return res.json();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read selected image'));
    reader.readAsDataURL(file);
  });
}

export async function uploadImage(file, { token, context = 'request' } = {}) {
  if (!file) throw new Error('Please select an image first');
  if (!file.type?.startsWith('image/')) throw new Error('Only image files are allowed');
  if (file.size > 5 * 1024 * 1024) throw new Error('Image must be 5MB or smaller');

  const fileData = await readFileAsDataUrl(file);
  return api('/uploads/image', {
    method: 'POST',
    token,
    body: {
      context,
      fileName: file.name,
      fileType: file.type,
      fileData
    }
  });
}

export function formatIQD(value) {
  return `${Number(value || 0).toLocaleString()} IQD`;
}
