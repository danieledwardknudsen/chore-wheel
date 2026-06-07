import { phoneVerifications } from '@chore-wheel/database';
import { ConsolePhoneVerificationSink, generateVerificationCode } from '@chore-wheel/domain';
import { db } from '@/lib/db';

const phoneVerificationSink = new ConsolePhoneVerificationSink();

const E164_REGEX = /^\+[1-9]\d{1,14}$/;

export const POST = async (request: Request): Promise<Response> => {
  let phone: string;
  try {
    const body = (await request.json()) as { phone?: unknown };
    if (typeof body.phone !== 'string' || !E164_REGEX.test(body.phone)) {
      return Response.json({ error: 'Invalid phone number' }, { status: 400 });
    }
    phone = body.phone;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.insert(phoneVerifications).values({ phone, code, expiresAt });
  await phoneVerificationSink.sendVerificationCode(phone, code);

  return Response.json({ ok: true });
};
