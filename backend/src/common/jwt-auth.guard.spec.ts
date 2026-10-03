// src/common/jwt-auth.guard.spec.ts
import { describe, it, expect } from 'vitest';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('should be defined and instantiate correctly', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });
});
