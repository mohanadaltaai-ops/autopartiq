const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'API request failed');
  }
  return res.json();
}

export function formatIQD(value) {
  return `${Number(value || 0).toLocaleString()} IQD`;
}
