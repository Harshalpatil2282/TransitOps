const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
    const json = await res.json()
    if (!res.ok) {
      return { data: null as any, error: json.error || `HTTP ${res.status}` }
    }
    return { data: json.data ?? json, error: undefined }
  } catch (err: any) {
    return { data: null as any, error: err.message || 'Network error' }
  }
}

export async function apiGet<T>(path: string): Promise<{ data: T; error?: string }> {
  return apiFetch<T>(path, { cache: 'no-store' })
}

export async function apiPost<T>(path: string, body: unknown): Promise<{ data: T; status?: number; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    return { data: null as any, status: res.status, error: json.error || `HTTP ${res.status}` }
  }
  return { data: json.data ?? json, status: res.status }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<{ data: T; status?: number; error?: string }> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) {
    return { data: null as any, status: res.status, error: json.error || `HTTP ${res.status}` }
  }
  return { data: json.data ?? json, status: res.status }
}
