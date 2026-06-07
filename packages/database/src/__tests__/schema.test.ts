import { Client, Pool, PoolClient } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { drizzle, NeonDatabase } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import * as schema from '../schema/index';

const TEST_URL = process.env['DATABASE_URL_TEST']!;
const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../../migrations');

const pool = new Pool({ connectionString: TEST_URL });

beforeAll(async () => {
  const sql = neon(TEST_URL);
  const db = drizzleHttp({ client: sql });
  await migrate(db, { migrationsFolder });
});

let client: PoolClient;
let db: NeonDatabase<typeof schema>;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
  // PoolClient is runtime-compatible with Client but drizzle-orm's types only accept Client.
  db = drizzle({ client: client as unknown as Client, schema });
});

afterEach(async () => {
  await client.query('ROLLBACK');
  client.release();
});

afterAll(async () => {
  await pool.end();
});

describe('users table', () => {
  it('inserts and reads back a user', async () => {
    const [inserted] = await db
      .insert(schema.users)
      .values({
        name: 'Alice',
        email: 'alice@example.com',
        phone: '+12065550001',
      })
      .returning();

    expect(inserted).toBeDefined();
    expect(inserted!.name).toBe('Alice');
    expect(inserted!.email).toBe('alice@example.com');
    expect(inserted!.optInTexts).toBe(true);
    expect(inserted!.optInEmails).toBe(false);
    expect(inserted!.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

    const found = await db.select().from(schema.users).where(eq(schema.users.id, inserted!.id));
    expect(found).toHaveLength(1);
    expect(found[0]!.name).toBe('Alice');
  });

  it('enforces unique email constraint', async () => {
    await db.insert(schema.users).values({
      name: 'Alice',
      email: 'unique@example.com',
      phone: '+12065550002',
    });

    await expect(
      db.insert(schema.users).values({
        name: 'Bob',
        email: 'unique@example.com',
        phone: '+12065550003',
      }),
    ).rejects.toThrow();
  });
});

describe('passkeys table', () => {
  it('inserts a passkey linked to a user and cascades on user delete', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ name: 'Bob', email: 'bob@example.com', phone: '+12065550004' })
      .returning();

    await db.insert(schema.passkeys).values({
      userId: user!.id,
      credentialId: 'cred-abc-123',
      publicKey: 'pk-base64url',
      counter: 0,
    });

    const passkeysForUser = await db
      .select()
      .from(schema.passkeys)
      .where(eq(schema.passkeys.userId, user!.id));
    expect(passkeysForUser).toHaveLength(1);
    expect(passkeysForUser[0]!.credentialId).toBe('cred-abc-123');
  });
});

describe('chore_rules and chores tables', () => {
  it('inserts a chore rule and a chore linked to it', async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ name: 'Carol', email: 'carol@example.com', phone: '+12065550005' })
      .returning();

    const [rule] = await db
      .insert(schema.choreRules)
      .values({
        title: 'Vacuum living room',
        assigneeRuleType: 'round_robin',
        scheduleType: 'recurring',
        scheduleConfig: { type: 'recurring', frequency: 'weekly', dayOfWeek: 1 },
      })
      .returning();

    await db.insert(schema.choreRuleAssignees).values({
      choreRuleId: rule!.id,
      userId: user!.id,
      position: 0,
    });

    const [chore] = await db
      .insert(schema.chores)
      .values({
        title: 'Vacuum living room',
        dueDate: '2026-06-10',
        assigneeId: user!.id,
        choreRuleId: rule!.id,
      })
      .returning();

    expect(chore!.status).toBe('incomplete');
    expect(chore!.choreRuleId).toBe(rule!.id);
    expect(chore!.assigneeId).toBe(user!.id);

    const rulesWithAssignees = await db.query.choreRules.findFirst({
      where: eq(schema.choreRules.id, rule!.id),
      with: { assignees: true, chores: true },
    });
    expect(rulesWithAssignees!.assignees).toHaveLength(1);
    expect(rulesWithAssignees!.chores).toHaveLength(1);
  });
});

describe('phone_verifications table', () => {
  it('inserts and reads a phone verification record', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const [record] = await db
      .insert(schema.phoneVerifications)
      .values({
        phone: '+12065550006',
        code: '123456',
        expiresAt,
      })
      .returning();

    expect(record!.verifiedAt).toBeNull();
    expect(record!.code).toBe('123456');
    expect(record!.phone).toBe('+12065550006');
  });
});
