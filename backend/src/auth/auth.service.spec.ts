// src/auth/auth.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;

  beforeEach(() => {
    mockUserModel = {
      findOne: vi.fn(),
      create: vi.fn(),
    };
    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock.jwt.token'),
    };
    authService = new AuthService(mockUserModel, mockJwtService);
  });

  describe('register', () => {
    it('should register a new user successfully and return token with user data', async () => {
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue({
        _id: 'user_123',
        email: 'test@example.com',
        password: 'hashed_password',
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUserModel.create).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user_123',
        email: 'test@example.com',
      });
      expect(result).toEqual({
        token: 'mock.jwt.token',
        user: {
          _id: 'user_123',
          email: 'test@example.com',
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({ _id: 'existing_id', email: 'test@example.com' });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully log in and return token with user data when credentials match', async () => {
      const hashedPassword = await bcrypt.hash('password123', 12);
      mockUserModel.findOne.mockResolvedValue({
        _id: 'user_123',
        email: 'test@example.com',
        password: hashedPassword,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user_123',
        email: 'test@example.com',
      });
      expect(result).toEqual({
        token: 'mock.jwt.token',
        user: {
          _id: 'user_123',
          email: 'test@example.com',
        },
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('different_password', 12);
      mockUserModel.findOne.mockResolvedValue({
        _id: 'user_123',
        email: 'test@example.com',
        password: hashedPassword,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
