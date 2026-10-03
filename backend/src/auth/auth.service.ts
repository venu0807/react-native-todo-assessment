// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already taken
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) throw new ConflictException('Email already registered');

    // Hash password with 12 bcrypt rounds — never store plain text
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.userModel.create({ email: dto.email, password: hashed });

    // Sign JWT with user id and email as payload
    const token = this.jwtService.sign({ sub: user._id.toString(), email: user.email });
    return { token, user: { _id: user._id, email: user.email } };
  }

  async login(dto: LoginDto) {
    // Lookup user by email — use same error message for both cases (prevents email enumeration)
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Compare hashed password
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user._id.toString(), email: user.email });
    return { token, user: { _id: user._id, email: user.email } };
  }
}
