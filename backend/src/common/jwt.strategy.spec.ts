// src/common/jwt.strategy.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
    strategy = new JwtStrategy();
  });

  it('validate should unpack sub and email into userId and email', async () => {
    const payload = { sub: 'user_456', email: 'user@example.com' };
    const result = await strategy.validate(payload);
    expect(result).toEqual({ userId: 'user_456', email: 'user@example.com' });
  });
});
