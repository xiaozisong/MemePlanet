import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export interface JwtPayload {
  sub: string; // user_id
  supabaseUid?: string;
  isPro?: boolean;
  roles?: string[];
  phone?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector = new Reflector(),
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: JwtPayload;
    }>();
    const auth = req.headers.authorization ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    if (!match) throw new UnauthorizedException('缺少 Authorization Header');

    try {
      const token = match[1] as string;
      const payload = await this.verifyToken(token);
      req.user = payload;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('JWT 无效或已过期');
    }
  }

  /**
   * 双轨 JWT 校验：
   * 1. 自签 JWT —— 用 JWT_SECRET 直接 verify
   * 2. Supabase 签发 JWT —— 用 SUPABASE_JWT_SECRET verify
   *
   * 判断依据：自签 JWT 不含 `iss` 或 `iss` 不是 Supabase URL；
   * Supabase JWT 的 `iss` 为 `{SUPABASE_URL}/auth/v1`。
   */
  private async verifyToken(token: string): Promise<JwtPayload> {
    // 先尝试解码 payload（不验证签名）以判别 issuer
    const payload = this.decodePayload(token);
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');

    // 如果 payload.iss 匹配 Supabase issuer，走 Supabase secret
    if (
      supabaseUrl &&
      payload &&
      typeof payload === 'object' &&
      'iss' in payload &&
      typeof payload.iss === 'string' &&
      payload.iss.startsWith(supabaseUrl)
    ) {
      const supabaseJwtSecret = this.configService.get<string>('SUPABASE_JWT_SECRET');
      if (!supabaseJwtSecret) {
        this.logger.warn('Supabase JWT 收到但 SUPABASE_JWT_SECRET 未配置');
        throw new UnauthorizedException('JWT 校验失败（Supabase 未配置）');
      }
      // 用 HS256 + SUPABASE_JWT_SECRET 校验。
      // Supabase 默认 HS256，但 jwtService 的 secret 是全局配置的，
      // 这里需要临时换 secret，所以用 jwt.verify（jsonwebtoken ESM import）。
      const { default: jwtVerify } = await import('jsonwebtoken');
      return jwtVerify(token, supabaseJwtSecret, { algorithms: ['HS256'] }) as JwtPayload;
    }

    // 默认走自签 JWT（HS256 + JWT_SECRET）
    return this.jwtService.verifyAsync<JwtPayload>(token);
  }

  /** 只解码 header 不验证签名 */
  private decodeHeader(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = (parts[0] as string).replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }

  /** 只解码 payload 不验证签名 */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private decodePayload(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = (parts[1] as string).replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }
}
