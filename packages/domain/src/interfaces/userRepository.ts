import type { User } from '../types/user.js';

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findUsersWithTextOptIn(): Promise<User[]>;
  findUsersWithEmailOptIn(): Promise<User[]>;
}
