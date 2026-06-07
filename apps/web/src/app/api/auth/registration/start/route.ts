import { passkeys, users } from '@chore-wheel/database';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const POST = async (request: Request): Promise<Response> => {
  let name: string;
  let email: string;
  let phone: string;
  try {
    const body = (await request.json()) as { name?: unknown; email?: unknown; phone?: unknown };
    if (
      typeof body.name !== 'string' ||
      typeof body.email !== 'string' ||
      typeof body.phone !== 'string'
    ) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    name = body.name;
    email = body.email;
    phone = body.phone;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const session = await getSession(await cookies());
  if (session.verifiedPhone !== phone) {
    return Response.json({ error: 'Phone not verified' }, { status: 403 });
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return Response.json({ error: 'Email already registered' }, { status: 409 });
  }

  const [user] = await db.insert(users).values({ name, email, phone }).returning();

  if (!user) {
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }

  const existingPasskeys = await db.select().from(passkeys).where(eq(passkeys.userId, user.id));

  const options = await generateRegistrationOptions({
    rpName: process.env['WEBAUTHN_RP_NAME']!,
    rpID: process.env['WEBAUTHN_RP_ID']!,
    userName: email,
    userDisplayName: name,
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: (pk.transports ?? []) as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  session.passkeyChallenge = options.challenge;
  session.userId = user.id;
  await session.save();

  return Response.json(options);
};
