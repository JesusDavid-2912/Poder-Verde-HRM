const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet(path, token) {
  const r = await fetch(`${API_URL}${path}`, { headers: authHeaders(token) });
  if (r.status === 401) throw new Error('UNAUTHORIZED');
  return r.json();
}

export async function apiPost(path, body, token) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (r.status === 401) throw new Error('UNAUTHORIZED');
  return r.json();
}

export async function apiPut(path, body, token) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (r.status === 401) throw new Error('UNAUTHORIZED');
  return r.json();
}

export async function apiPostForm(path, formData, token) {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (r.status === 401) throw new Error('UNAUTHORIZED');
  const contentType = r.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return r.json();
  const message = await r.text();
  return {
    success: false,
    message: message || 'No se pudo procesar el archivo',
  };
}

export { API_URL };
