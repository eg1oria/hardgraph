import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/verify-email',
  '/explore',
  '/templates',
  '/api',
  '/auth',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check if path is public (landing, public profiles at /[username], public graphs at /[username]/[slug])
  const isPublicPath = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const appPrefixes = ['/dashboard', '/editor', '/settings', '/onboarding', '/admin'];
  const isAppRoute = appPrefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isPublicProfile =
    !isAppRoute && !isPublicPath && /^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)?$/.test(pathname);

  if (isPublicPath || isPublicProfile) {
    return NextResponse.next();
  }

  // For protected routes, we can't check localStorage from middleware
  // The auth guard will be handled client-side via useAuthGuard hook
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
