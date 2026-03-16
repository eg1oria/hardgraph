const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> = { data: T; timestamp: string } | T;

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

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
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    parsed = null;
  }

  if (!res.ok) {
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

  const json = parsed as ApiEnvelope<T> | null;
  if (json && typeof json === 'object' && 'data' in json && 'timestamp' in json) {
    return (json as { data: T }).data;
  }

  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Server-side fetch — no auth, no credentials, with Next.js revalidation */
export async function fetchPublic<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    next: { revalidate },
  });

  if (!res.ok) {
    throw new ApiError(res.status, 'Not found');
  }

  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}
