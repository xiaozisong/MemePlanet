import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { z } from 'zod';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';

const SendOtpSchema = z.object({
  phone: z.string().regex(/^\+?\d{7,15}$/),
});
const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?\d{7,15}$/),
  code: z.string().regex(/^\d{4,6}$/),
});
const OAuthSchema = z.object({
  provider: z.enum(['wechat', 'apple', 'qq']),
  token: z.string().min(1),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('otp/send')
  async sendOtp(@Body() body: unknown) {
    const dto = SendOtpSchema.parse(body);
    return this.auth.sendOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  async verifyOtp(@Body() body: unknown, @Req() req: Request) {
    const dto = VerifyOtpSchema.parse(body);
    return this.auth.verifyOtp(dto.phone, dto.code, req);
  }

  @Public()
  @Post('oauth')
  async oauth(@Body() body: unknown) {
    const dto = OAuthSchema.parse(body);
    return this.auth.oauth(dto.provider, dto.token);
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    return this.auth.refresh(req);
  }
}
