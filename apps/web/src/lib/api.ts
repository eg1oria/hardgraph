const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

/** Check if the response JSON matches the API envelope shape { data, timestamp } */
function isEnvelope(json: unknown): json is { data: unknown; timestamp: string } {
  return (
    json != null &&
    typeof json === 'object' &&
    'data' in json &&
    'timestamp' in json &&
    typeof (json as Record<string, unknown>).timestamp === 'string'
  );
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    signal,
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    // On 401, clear stale token and sync auth store
    if (res.status === 401 && typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
      } catch {
        // ignore
      }
      // Lazy-import to avoid circular dependency; notify store so UI reacts
      try {
        const { useAuthStore } = await import('@/stores/useAuthStore');
        const state = useAuthStore.getState();
        if (state.isAuthenticated) {
          state.logout();
        }
      } catch {
        // ignore — store may not be available during SSR
      }
    }

    const error = (parsed ?? {}) as { message?: string | string[] } | null;
    const rawMessage = error?.message;
    const message: string =
      Array.isArray(rawMessage) && rawMessage[0]
        ? rawMessage[0]
        : typeof rawMessage === 'string'
          ? rawMessage
          : 'Request failed';
    throw new ApiError(res.status, message);
  }

  if (isEnvelope(parsed)) {
    return parsed.data as T;
  }

  return parsed as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>('GET', path, undefined, signal),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('POST', path, body, signal),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('PUT', path, body, signal),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>('PATCH', path, body, signal),
  delete: <T>(path: string, signal?: AbortSignal) => request<T>('DELETE', path, undefined, signal),
};

/** Server-side fetch — no auth, no credentials, with Next.js revalidation */
export async function fetchPublic<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate },
  });

  if (!res.ok) {
    let message = 'Request failed';
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message) ? body.message[0] : body.message;
      }
    } catch {
      // body not JSON — keep default message
    }
    throw new ApiError(res.status, message);
  }

  const json = await res.json();
  if (isEnvelope(json)) {
    return json.data as T;
  }
  return json as T;
}
