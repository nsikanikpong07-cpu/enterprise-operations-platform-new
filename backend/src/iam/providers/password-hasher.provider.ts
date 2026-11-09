import type { Provider } from '@nestjs/common';
import * as argon2 from 'argon2';

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, encodedHash: string): Promise<boolean>;
}

class Argon2idPasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });
  }

  async verify(
    plain: string,
    encodedHash: string,
  ): Promise<boolean> {
    if (!encodedHash.startsWith('$argon2id$')) {
      return false;
    }

    return argon2.verify(encodedHash, plain);
  }
}

export const passwordHasherProvider: Provider<PasswordHasher> = {
  provide: PASSWORD_HASHER,
  useClass: Argon2idPasswordHasher,
};