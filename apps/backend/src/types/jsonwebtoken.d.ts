declare module 'jsonwebtoken' {
  import type { Algorithm } from 'crypto';

  interface VerifyOptions {
    algorithms?: Algorithm[];
    issuer?: string;
    audience?: string;
    subject?: string;
    maxAge?: string | number;
    clockTolerance?: number;
  }

  interface JwtPayload {
    [key: string]: unknown;
    sub?: string;
    iat?: number;
    exp?: number;
    aud?: string | string[];
    iss?: string;
    jti?: string;
  }

  const verify: (token: string, secretOrPublicKey: string, options?: VerifyOptions) => JwtPayload;
  export default verify;
}
