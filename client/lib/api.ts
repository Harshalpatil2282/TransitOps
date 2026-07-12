const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

async function rawFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
}

export async function apiGet<T>(path: string): Promise<{ data: T; error?: string }> {
  try {
    const res = await rawFetch(path, { cache: 'no-store' })
    const json: ApiResponse<T> = await res.json()
    if (!res.ok || !json.success) {
      return { data: null as any, error: (json as any).error || `HTTP ${res.status}` }
    }
    return { data: (json as any).data }
  } catch (err: any) {
    return { data: null as any, error: err.message || 'Network error' }
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown
): Promise<{ data: T; status: number; error?: string }> {
  try {
    const res = await rawFetch(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    const json: ApiResponse<T> = await res.json()
    if (!res.ok || !json.success) {
      return { data: null as any, status: res.status, error: (json as any).error || `HTTP ${res.status}` }
    }
    return { data: (json as any).data, status: res.status }
  } catch (err: any) {
    return { data: null as any, status: 500, error: err.message || 'Network error' }
  }
}

export async function apiPatch<T>(
  path: string,
  body: unknown
): Promise<{ data: T; status: number; error?: string }> {
  try {
    const res = await rawFetch(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    const json: ApiResponse<T> = await res.json()
    if (!res.ok || !json.success) {
      return { data: null as any, status: res.status, error: (json as any).error || `HTTP ${res.status}` }
    }
    return { data: (json as any).data, status: res.status }
  } catch (err: any) {
    return { data: null as any, status: 500, error: err.message || 'Network error' }
  }
}

export async function apiDelete<T>(
  path: string
): Promise<{ data: T; status: number; error?: string }> {
  try {
    const res = await rawFetch(path, { method: 'DELETE' })
    const json: ApiResponse<T> = await res.json()
    if (!res.ok || !json.success) {
      return { data: null as any, status: res.status, error: (json as any).error || `HTTP ${res.status}` }
    }
    return { data: (json as any).data, status: res.status }
  } catch (err: any) {
    return { data: null as any, status: 500, error: err.message || 'Network error' }
  }
}
