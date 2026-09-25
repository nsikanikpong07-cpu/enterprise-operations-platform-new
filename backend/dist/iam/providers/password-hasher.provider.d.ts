import { Provider } from '@nestjs/common';
export declare const PASSWORD_HASHER: unique symbol;
export interface PasswordHasher {
    hash(plain: string): string;
    verify(plain: string, hash: string): boolean;
}
export declare const passwordHasherProvider: Provider<PasswordHasher>;
