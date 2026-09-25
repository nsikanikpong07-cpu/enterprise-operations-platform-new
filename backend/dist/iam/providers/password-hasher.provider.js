import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
class ScryptPasswordHasher {
    hash(plain) {
        const salt = randomBytes(16).toString('hex');
        const derived = scryptSync(plain, salt, 64).toString('hex');
        return `scrypt:${salt}:${derived}`;
    }
    verify(plain, hash) {
        const [, salt, expected] = hash.split(':');
        if (!salt || !expected)
            return false;
        const derived = scryptSync(plain, salt, 64);
        return timingSafeEqual(derived, Buffer.from(expected, 'hex'));
    }
}
export const passwordHasherProvider = {
    provide: PASSWORD_HASHER,
    useClass: ScryptPasswordHasher,
};
//# sourceMappingURL=password-hasher.provider.js.map