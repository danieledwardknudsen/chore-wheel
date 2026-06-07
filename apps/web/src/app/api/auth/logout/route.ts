import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';

export const POST = async (_request: Request): Promise<Response> => {
  const session = await getSession(await cookies());
  session.destroy();
  return Response.json({ ok: true });
};
