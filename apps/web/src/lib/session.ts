import { getIronSession, type IronSession } from 'iron-session';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

export type SessionData = {
  userId?: string;
  passkeyChallenge?: string;
  verifiedPhone?: string;
};

export const sessionOptions = {
  password: process.env['SESSION_SECRET']!,
  cookieName: 'chore-wheel-session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export type Session = IronSession<SessionData>;

// Local structural stand-in for iron-session's non-exported CookieStore interface.
// ReadonlyRequestCookies is runtime-compatible but its set() third parameter is typed
// as `Partial<ResponseCookie> | undefined` under exactOptionalPropertyTypes, whereas
// CookieStore declares it as `Partial<ResponseCookie>` (no explicit undefined).
// Casting through this type avoids widening to `any` while satisfying the 2-arg overload.
type CookieStoreCompat = {
  get(name: string): { name: string; value: string } | undefined;
  set(name: string, value: string, cookie?: object): void;
  set(options: object): void;
  delete(name: string): void;
};

export const getSession = (cookieStore: ReadonlyRequestCookies): Promise<Session> =>
  getIronSession<SessionData>(cookieStore as unknown as CookieStoreCompat, sessionOptions);
