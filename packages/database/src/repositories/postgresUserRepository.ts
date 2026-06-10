import type { UserRepository } from '@chore-wheel/domain';
import type { User } from '@chore-wheel/domain';
import { asc, eq } from 'drizzle-orm';
import type { DatabaseClient } from '../client';
import { users } from '../schema/index';

const mapUser = (row: typeof users.$inferSelect): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  optInEmails: row.optInEmails,
});

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findAll(): Promise<User[]> {
    const rows = await this.db.select().from(users).orderBy(asc(users.name));
    return rows.map(mapUser);
  }

  async findById(id: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findUsersWithEmailOptIn(): Promise<User[]> {
    const rows = await this.db.select().from(users).where(eq(users.optInEmails, true));
    return rows.map(mapUser);
  }

  async updateProfile(
    id: string,
    input: {
      name?: string | undefined;
      optInEmails?: boolean | undefined;
    },
  ): Promise<User | null> {
    const rows = await this.db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}
