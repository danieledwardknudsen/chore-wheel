import type { User } from '../types/user';

export type UpdateProfileInput = {
  name?: string;
  optInEmails?: boolean;
  emoji?: string | null;
};

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findUsersWithEmailOptIn(): Promise<User[]>;
  updateProfile(id: string, input: UpdateProfileInput): Promise<User | null>;
}
