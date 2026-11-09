import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_LIFETIME_SECONDS } from '../dist/auth/token-config.js';
import { AuthService } from '../dist/auth/providers/auth.service.js';

test('access token and login response both specify one hour', async () => {
  assert.equal(ACCESS_TOKEN_LIFETIME_SECONDS, 3600);
  const jwt = new JwtService({ secret: 'x'.repeat(64), signOptions: { expiresIn: ACCESS_TOKEN_LIFETIME_SECONDS } });
  const user = { id: 'ba46e2cb-1803-4e21-a016-4f159108e4a1', email: 'demo@example.com', firstName: 'Demo', lastName: 'User', status: 'active', authVersion: 1, passwordHash: '$argon2id$demo' };
  const users = { createQueryBuilder: () => ({ addSelect() { return this; }, where() { return this; }, async getOne() { return user; } }) };
  const memberships = { async findOne() { return null; } };
  const hasher = { async verify() { return true; } };
  const rate = { async consume() {}, async loginSucceeded() {} };
  const audit = { async write() {} };
  const db = { async transaction(fn) { return fn({ async query(sql) { return sql.startsWith('SELECT') ? [{ id: user.id, status: 'active', auth_version: 1 }] : []; } }); } };
  const auth = new AuthService(users, memberships, hasher, jwt, rate, audit, db);
  const result = await auth.login({ email: user.email, password: 'demo' }, '127.0.0.1');
  const payload = jwt.decode(result.accessToken);
  assert.equal(payload.exp - payload.iat, 3600);
  assert.equal(result.expiresIn, 3600);
});
