// Auth utilities — token management with safe storage access
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem('token', token);
  } catch {
    // Storage unavailable (private browsing, quota exceeded)
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem('token');
  } catch {
    // ignore
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
