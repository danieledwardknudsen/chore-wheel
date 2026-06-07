import { passkeys, users } from '@chore-wheel/database';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const POST = async (request: Request): Promise<Response> => {
  let email: string;
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email !== 'string') {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    email = body.email;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = userRows[0];
  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const userPasskeys = await db.select().from(passkeys).where(eq(passkeys.userId, user.id));

  const options = await generateAuthenticationOptions({
    rpID: process.env['WEBAUTHN_RP_ID']!,
    allowCredentials: userPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: (pk.transports ?? []) as AuthenticatorTransportFuture[],
    })),
    userVerification: 'preferred',
  });

  const session = await getSession(await cookies());
  session.passkeyChallenge = options.challenge;
  session.userId = user.id;
  await session.save();

  return Response.json(options);
};
