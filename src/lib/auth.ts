import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Default passwords for each mode
export const DEFAULT_MODE_PASSWORDS = {
  ABALAT: 'Mahi_ta',
  COURSE: 'Abuchu',
  MEZMUR: 'Simret',
  MEMBER: 'Welcome@123',
} as const;

export type AppMode = 'ABALAT' | 'COURSE' | 'MEZMUR' | 'MEMBER';
