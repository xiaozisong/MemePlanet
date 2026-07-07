import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

export interface EnvelopeData<T> {
  code: number;
  data: T;
  message: string;
  traceId?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, EnvelopeData<T> | T> {
  constructor(private readonly reflector: Reflector = new Reflector()) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<EnvelopeData<T> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((data) => {
        if (isRaw) return data;
        const req = context.switchToHttp().getRequest<{
          headers: Record<string, string>;
        }>();
        return {
          code: 0,
          data,
          message: 'OK',
          traceId: req.headers['x-trace-id'] as string | undefined,
        };
      }),
    );
  }
}
