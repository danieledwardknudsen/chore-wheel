import { passkeys } from '@chore-wheel/database';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import type {
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const POST = async (request: Request): Promise<Response> => {
  let body: RegistrationResponseJSON;
  try {
    body = (await request.json()) as RegistrationResponseJSON;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const session = await getSession(await cookies());
  if (!session.passkeyChallenge || !session.userId) {
    return Response.json({ error: 'No pending registration' }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: session.passkeyChallenge,
      expectedOrigin: process.env['WEBAUTHN_ORIGIN']!,
      expectedRPID: process.env['WEBAUTHN_RP_ID']!,
    });
  } catch {
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return Response.json({ error: 'Verification failed' }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await db.insert(passkeys).values({
    userId: session.userId,
    credentialId: credential.id,
    publicKey: isoBase64URL.fromBuffer(credential.publicKey),
    counter: credential.counter,
    transports: (body.response.transports ?? []) as AuthenticatorTransportFuture[],
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
  });

  delete session.passkeyChallenge;
  delete session.verifiedPhone;
  await session.save();

  return Response.json({ success: true });
};
