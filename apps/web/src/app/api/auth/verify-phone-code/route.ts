import { phoneVerifications } from '@chore-wheel/database';
import { isVerificationCodeExpired } from '@chore-wheel/domain';
import { and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export const POST = async (request: Request): Promise<Response> => {
  let phone: string;
  let code: string;
  try {
    const body = (await request.json()) as { phone?: unknown; code?: unknown };
    if (typeof body.phone !== 'string' || typeof body.code !== 'string') {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }
    phone = body.phone;
    code = body.code;
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const records = await db
    .select()
    .from(phoneVerifications)
    .where(
      and(
        eq(phoneVerifications.phone, phone),
        eq(phoneVerifications.code, code),
        isNull(phoneVerifications.verifiedAt),
      ),
    )
    .orderBy(phoneVerifications.createdAt)
    .limit(1);

  const record = records[0];
  if (!record || isVerificationCodeExpired(record.expiresAt)) {
    return Response.json({ error: 'Invalid or expired code' }, { status: 400 });
  }

  await db
    .update(phoneVerifications)
    .set({ verifiedAt: new Date() })
    .where(eq(phoneVerifications.id, record.id));

  const session = await getSession(await cookies());
  session.verifiedPhone = phone;
  await session.save();

  return Response.json({ verified: true });
};
