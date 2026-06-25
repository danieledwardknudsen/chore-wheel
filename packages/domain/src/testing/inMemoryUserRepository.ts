import type { UpdateProfileInput, UserRepository } from '../interfaces/userRepository';
import type { User } from '../types/user';

export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[];

  constructor(users: User[] = []) {
    this.users = [...users];
  }

  findAll(): Promise<User[]> {
    return Promise.resolve([...this.users]);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.id === id) ?? null);
  }

  findUsersWithEmailOptIn(): Promise<User[]> {
    return Promise.resolve(this.users.filter((u) => u.optInEmails));
  }

  updateProfile(id: string, input: UpdateProfileInput): Promise<User | null> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return Promise.resolve(null);

    const updated = { ...this.users[index]!, ...input };
    this.users[index] = updated;
    return Promise.resolve(updated);
  }
}
