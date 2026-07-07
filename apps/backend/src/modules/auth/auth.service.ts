import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(phone: string): Promise<{ sent: true; ttlSec: number }> {
    // TODO: 接入阿里云/腾讯云短信，OTP 写 Redis（5min TTL），限频 60s
    this.logger.log(`OTP send stub for ${phone}`);
    return { sent: true, ttlSec: 300 };
  }

  async verifyOtp(phone: string, code: string, _req: Request): Promise<{ token: string }> {
    // TODO: 从 Redis 取 OTP 校验，校验后 upsert users 表，签发 JWT
    if (code !== '123456') throw new UnauthorizedException('验证码错误');
    const payload: JwtPayload = { sub: phone, roles: ['user'] };
    const token = await this.jwt.signAsync(payload);
    return { token };
  }

  async oauth(provider: 'wechat' | 'apple' | 'qq', token: string) {
    // TODO: 走 Supabase Auth OAuth，回调后同步用户到国内 PG
    this.logger.log(`OAuth stub: provider=${provider}, token=${token.slice(0, 8)}...`);
    throw new UnauthorizedException('OAuth 暂未启用（M2 接入）');
  }

  async refresh(req: Request): Promise<{ token: string }> {
    const auth = req.headers.authorization ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (!match) throw new UnauthorizedException('缺少 token');
    // TODO: 校验旧 token + 滚动签发新 token
    const payload = await this.jwt.verifyAsync<JwtPayload>(match[1] as string);
    return { token: await this.jwt.signAsync(payload) };
  }
}
