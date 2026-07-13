import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { JwtPayload } from '../../common/guards/jwt-auth.guard.js';
import { REDIS } from '../../database/redis.module.js';
import { DRIZZLE, type DbType } from '../../database/drizzle.module.js';
import { users } from '../../database/schema.js';
import type Redis from 'ioredis';
import { randomInt } from 'node:crypto';

const OTP_TTL_SEC = 300; // 5 分钟有效
const OTP_RATE_LIMIT_SEC = 60; // 同号 60s 限频
const OTP_HOURLY_LIMIT = 3; // 同号每小时最多 3 次
const OTP_HOURLY_TTL = 3600; // 1 小时滑动窗口

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(DRIZZLE) private readonly db: DbType,
  ) {}

  /**
   * 生成 6 位 OTP → Redis 存储（5min TTL）→ 限频检查
   * 短信 SDK 接入前，日志打印 OTP（开发阶段）
   */
  async sendOtp(phone: string): Promise<{ sent: boolean; ttlSec: number }> {
    // 同号 60s 内不可重发
    const rateKey = `otp:ratelimit:${phone}`;
    const rateTtl = await this.redis.ttl(rateKey);
    if (rateTtl > 0) {
      throw new BadRequestException(`验证码已发送，请 ${rateTtl}s 后重试`);
    }

    // 每小时限频 3 次
    const hourlyKey = `otp:hourly:${phone}`;
    const hourlyCount = await this.redis.incr(hourlyKey);
    if (hourlyCount === 1) {
      await this.redis.expire(hourlyKey, OTP_HOURLY_TTL);
    }
    if (hourlyCount > OTP_HOURLY_LIMIT) {
      throw new BadRequestException('验证码发送过于频繁，请稍后再试');
    }

    // 生成 6 位 OTP
    const code = String(randomInt(100_000, 999_999)).padStart(6, '0');

    // Redis 存储 OTP
    const otpKey = `otp:${phone}`;
    await this.redis.set(otpKey, code, 'EX', OTP_TTL_SEC);

    // 设置 60s 重发限频
    await this.redis.set(rateKey, '1', 'EX', OTP_RATE_LIMIT_SEC);

    // TODO: 接入阿里云/腾讯云短信 SDK，替换为真实短信发送
    // 目前开发阶段：日志打印 OTP
    this.logger.log(`[DEV] OTP for ${phone}: ${code} (TTL ${OTP_TTL_SEC}s)`);

    return { sent: true, ttlSec: OTP_TTL_SEC };
  }

  /**
   * 校验 OTP → upsert users 表 → 签发 JWT
   */
  async verifyOtp(
    phone: string,
    code: string,
    _req: Request,
  ): Promise<{ token: string; userId: string }> {
    // 从 Redis 取 OTP
    const otpKey = `otp:${phone}`;
    const storedCode = await this.redis.get(otpKey);

    if (!storedCode) {
      throw new UnauthorizedException('验证码已过期或未发送');
    }

    if (storedCode !== code) {
      throw new UnauthorizedException('验证码错误');
    }

    // 校验通过，删除 OTP
    await this.redis.del(otpKey);

    // 清理限频 key
    await this.redis.del(`otp:ratelimit:${phone}`);

    // upsert users 表（INSERT ON CONFLICT DO UPDATE）
    const result = await this.db
      .insert(users)
      .values({
        phone,
        nickname: `用户${phone.slice(-4)}`,
        status: 'active',
        lastLoginAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.phone,
        set: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning({ userId: users.userId });

    const userId = result[0]?.userId;
    if (!userId) {
      throw new Error('用户创建/更新失败');
    }

    // 签发 JWT
    const payload: JwtPayload = {
      sub: userId as string,
      phone,
      roles: ['user'],
    };
    const token = await this.jwt.signAsync(payload);

    this.logger.log(`User ${userId} logged in via OTP, phone: ${phone}`);

    return { token, userId: userId as string };
  }

  /**
   * OAuth 登录（M2 接入）
   */
  async oauth(provider: 'wechat' | 'apple' | 'qq', token: string) {
    this.logger.log(`OAuth stub: provider=${provider}, token=${token.slice(0, 8)}...`);
    throw new UnauthorizedException('OAuth 暂未启用（M2 接入）');
  }

  /**
   * 刷新 JWT（滚动签发）
   */
  async refresh(req: Request): Promise<{ token: string }> {
    const auth = req.headers.authorization ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (!match) throw new UnauthorizedException('缺少 token');

    const payload = await this.jwt.verifyAsync<JwtPayload>(match[1] as string);

    // 剔除 iat/exp 保留字段，重新签发
    const { iat, exp, ...claims } = payload as JwtPayload & { iat?: number; exp?: number };
    void iat;
    void exp;

    return { token: await this.jwt.signAsync(claims) };
  }
}
