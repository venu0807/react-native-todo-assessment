// src/auth/auth.controller.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(() => {
    mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
    };
    authController = new AuthController(mockAuthService as AuthService);
  });

  it('register should delegate to authService.register', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const expected = { token: 'jwt.token', user: { _id: '1', email: 'test@example.com' } };
    (mockAuthService.register as any).mockResolvedValue(expected);

    const result = await authController.register(dto);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('login should delegate to authService.login', async () => {
    const dto = { email: 'test@example.com', password: 'password123' };
    const expected = { token: 'jwt.token', user: { _id: '1', email: 'test@example.com' } };
    (mockAuthService.login as any).mockResolvedValue(expected);

    const result = await authController.login(dto);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });
});
