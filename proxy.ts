import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/api/auth', '/api/health', '/api/openapi', '/docs'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Allow API requests with Bearer token (API token auth)
  const authHeader = request.headers.get('authorization');
  if (pathname.startsWith('/api/') && authHeader?.startsWith('Bearer ')) {
    return NextResponse.next();
  }

  // Allow internal API requests (server-to-server calls from AI tools)
  const internalUserId = request.headers.get('x-internal-user-id');
  if (pathname.startsWith('/api/') && internalUserId) {
    // Only allow from localhost for security
    const host = request.headers.get('host') || '';
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
      return NextResponse.next();
    }
  }

  // Check for session cookie (authjs.session-token or __Secure-authjs.session-token)
  const sessionToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value;

  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
