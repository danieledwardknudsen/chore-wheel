import { type SessionData, sessionOptions } from '@/lib/session';
import { getIronSession } from 'iron-session';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/', '/login', '/register']);
const AUTH_ONLY_PATHS = new Set(['/login', '/register']);
const AUTH_API_PREFIX = '/api/auth';
const CRON_PATH = '/api/jobs/assign-chores';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(AUTH_API_PREFIX) || pathname === CRON_PATH) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // Signed-in users cannot reach the login/register pages.
  if (session.userId && AUTH_ONLY_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL('/chores', request.url));
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return response;
  }

  if (!session.userId) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon|apple-icon).*)'],
};
