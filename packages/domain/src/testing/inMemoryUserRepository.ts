import type { UserRepository } from '../interfaces/userRepository.js';
import type { User } from '../types/user.js';

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

  findUsersWithTextOptIn(): Promise<User[]> {
    return Promise.resolve(this.users.filter((u) => u.optInTexts));
  }

  findUsersWithEmailOptIn(): Promise<User[]> {
    return Promise.resolve(this.users.filter((u) => u.optInEmails));
  }
}
