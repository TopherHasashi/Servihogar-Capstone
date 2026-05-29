export const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type') || ''
    // Prefer plain text if server sends it
    if (ct.includes('text/plain')) {
      const t = (await res.text()).trim()
      return t || `Error ${res.status}`
    }
    // Try JSON
    if (ct.includes('application/json')) {
      const data = await res.json()
      if (typeof data === 'string') return data
      if (data?.message) {
        return Array.isArray(data.message) ? String(data.message[0]) : String(data.message)
      }
      if (data?.detail) return String(data.detail)
      // Try to pick first field error
      for (const key of ['rut', 'email', 'non_field_errors']) {
        if (data?.[key]) {
          const v = data[key]
          return Array.isArray(v) ? String(v[0]) : String(v)
        }
      }
      // Fallback to stringify
      return JSON.stringify(data)
    }
    // Unknown content-type: fall back to text
    const raw = (await res.text()).trim()
    return raw || `Error ${res.status}`
  } catch {
    return `Error ${res.status}`
  }
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(await extractErrorMessage(res));
  return res.json();
}

function getRefreshToken() {
  return localStorage.getItem('auth_refresh') || ''
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const access = data?.access || data?.access_token
    if (!access) return null
    saveTokens({ access, refresh })
    return access
  } catch {
    return null
  }
}

async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  let token = getAccessToken()
  if (!token) {
    // Try to refresh if we still have a refresh token saved
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      token = refreshed
    } else {
      throw new Error('AUTH_MISSING')
    }
  }
  const headers: Record<string, string> = Object.assign({}, (init.headers || {} as any))
  headers['Authorization'] = `Bearer ${token}`
  headers['Accept'] = headers['Accept'] || 'application/json'
  const first = await fetch(input, { ...init, headers })
  if (first.status !== 401) return first
  // Try refresh once
  const newAccess = await refreshAccessToken()
  if (!newAccess) {
    clearTokens()
    return first
  }
  headers['Authorization'] = `Bearer ${newAccess}`
  return fetch(input, { ...init, headers })
}

export async function apiPost<TBody extends Record<string, any>>(path: string, body: TBody, opts?: { auth?: boolean }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  const url = `${API_URL}${path}`
  let res: Response
  if (opts?.auth) {
    res = await fetchWithAuth(url, { method: 'POST', headers, body: JSON.stringify(body) })
  } else {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  }
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  return res.json();
}

export async function apiPostForm(path: string, formData: FormData, opts?: { auth?: boolean }) {
  const url = `${API_URL}${path}`
  let res: Response
  if (opts?.auth) {
    res = await fetchWithAuth(url, { method: 'POST', body: formData })
  } else {
    res = await fetch(url, { method: 'POST', body: formData })
  }
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res))
  }
  return res.json()
}

export function saveTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem('auth_access', tokens.access);
  localStorage.setItem('auth_refresh', tokens.refresh);
}

export function getAccessToken() {
  return localStorage.getItem('auth_access') || '';
}

export function clearTokens() {
  localStorage.removeItem('auth_access');
  localStorage.removeItem('auth_refresh');
}

export async function apiGetAuth(path: string) {
  const res = await fetchWithAuth(`${API_URL}${path}`)
  if (!res.ok) throw new Error(await extractErrorMessage(res))
  return res.json()
}

export async function apiPutAuth<TBody extends Record<string, any>>(path: string, body: TBody) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  const res = await fetchWithAuth(`${API_URL}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res))
  }
  // Some endpoints may return 204
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return { ok: true } as any
}

export async function apiPostAuth<TBody extends Record<string, any>>(path: string, body: TBody) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  const res = await fetchWithAuth(`${API_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res))
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return { ok: true } as any
}

export async function apiDeleteAuth(path: string) {
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  const res = await fetchWithAuth(`${API_URL}${path}`, { method: 'DELETE', headers })
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res))
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return { ok: true } as any
}
