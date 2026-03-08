import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes accessible without authentication
const PUBLIC_ROUTES = ['/login', '/join', '/api/auth'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/'),
  );

  const isLoggedIn = !!req.auth;

  // Not logged in — redirect to /login (unless already on public route)
  if (!isLoggedIn && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Logged in — don't let them visit /login (preserve join redirect)
  if (isLoggedIn && pathname === '/login') {
    const url = req.nextUrl.clone();
    const joinCode = req.nextUrl.searchParams.get('join');
    url.pathname = joinCode ? `/join/${joinCode}` : '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|sw\\.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
