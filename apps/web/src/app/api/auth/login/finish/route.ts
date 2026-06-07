import { passkeys } from '@chore-wheel/database';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const POST = async (request: Request): Promise<Response> => {
  let body: AuthenticationResponseJSON;
  try {
    body = (await request.json()) as AuthenticationResponseJSON;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const session = await getSession(await cookies());
  if (!session.passkeyChallenge || !session.userId) {
    return Response.json({ error: 'No pending authentication' }, { status: 400 });
  }

  const passkeyRows = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.credentialId, body.id))
    .limit(1);

  const passkey = passkeyRows[0];
  if (!passkey || passkey.userId !== session.userId) {
    return Response.json({ error: 'Passkey not found' }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: session.passkeyChallenge,
      expectedOrigin: process.env['WEBAUTHN_ORIGIN']!,
      expectedRPID: process.env['WEBAUTHN_RP_ID']!,
      credential: {
        id: passkey.credentialId,
        publicKey: isoBase64URL.toBuffer(passkey.publicKey),
        counter: passkey.counter,
        transports: (passkey.transports ?? []) as AuthenticatorTransportFuture[],
      },
    });
  } catch {
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  if (!verification.verified) {
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  await db
    .update(passkeys)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(passkeys.id, passkey.id));

  delete session.passkeyChallenge;
  await session.save();

  return Response.json({ success: true });
};
