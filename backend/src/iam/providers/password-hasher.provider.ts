import { Provider } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  hash(plain: string): string;
  verify(plain: string, hash: string): boolean;
}

class ScryptPasswordHasher implements PasswordHasher {
  hash(plain: string): string {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(plain, salt, 64).toString('hex');
    return `scrypt:${salt}:${derived}`;
  }

  verify(plain: string, hash: string): boolean {
    const [, salt, expected] = hash.split(':');
    if (!salt || !expected) return false;
    const derived = scryptSync(plain, salt, 64);
    return timingSafeEqual(derived, Buffer.from(expected, 'hex'));
  }
}

export const passwordHasherProvider: Provider<PasswordHasher> = {
  provide: PASSWORD_HASHER,
  useClass: ScryptPasswordHasher,
};
