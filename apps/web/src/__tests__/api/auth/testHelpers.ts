import { sealData } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/session';

export const createSessionCookie = async (data: SessionData): Promise<string> => {
  return sealData(data, { password: sessionOptions.password });
};

export const makeCookieHeader = (name: string, value: string): string => `${name}=${value}`;
