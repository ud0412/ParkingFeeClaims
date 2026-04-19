import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Protect dashboard, history, claim, admin and related APIs
  const protectedPaths = ['/dashboard', '/claim', '/history', '/admin', '/api/claim', '/api/admin'];
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  // If visiting root, redirect to dashboard
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect to dashboard if logged in and visiting login/register
  if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
     return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtectedPath) {
    if (!token) {
      // Redirect to login if unauthenticated on protected route
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyToken(token);
    
    // Invalid or expired token
    if (!payload) {
      if (request.nextUrl.pathname.startsWith('/api/')) {
        const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
        response.cookies.delete('auth_token');
        return response;
      }
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }

    // Role check for admin
    if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'admin' && payload.role !== 'manager') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Check for auto-refresh: user commit or page refresh
    // If it's been more than 10 mins since iat, refresh token (totalling 20m max age)
    const iat = payload.iat as number;
    const now = Math.floor(Date.now() / 1000);
    const tenMinutes = 10 * 60;
    
    // Only refresh on GET requests (page loads) OR explicit mutative requests (commits/actions)
    // Here we generally refresh if they just interact with the system
    if (now - iat > tenMinutes) {
      const newToken = await signToken({
        sub: payload.sub as string,
        role: payload.role as string,
        name: payload.name as string,
      });

      // Construct identical response but inject updated cookie
      const response = NextResponse.next();
      response.cookies.set('auth_token', newToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 20 * 60, // Extend for another 20 minutes
        path: '/',
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
