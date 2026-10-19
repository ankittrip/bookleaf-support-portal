import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Model } from 'mongoose';

import { User } from '../users/schemas/user.schema.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.userModel
      .findOne({ email })
      .select('+passwordHash')
      .exec();

    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      authorId: user.authorId ?? null,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '1d',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        authorId: user.authorId ?? null,
      },
    };
  }
}