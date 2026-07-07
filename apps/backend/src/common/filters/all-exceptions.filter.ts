import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// zod 错误识别（避免在 filter 里硬依赖 zod 类型，按结构判定）
function isZodError(e: unknown): e is { errors: { message: string }[] } {
  return (
    e instanceof Error &&
    (e.constructor?.name === 'ZodError' || (e as { name?: string }).name === 'ZodError') &&
    Array.isArray((e as { errors?: unknown }).errors)
  );
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request.headers['x-trace-id'] as string | undefined) ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 50000;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message = (r.message as string | string[] | undefined)
          ? Array.isArray(r.message)
            ? r.message.join('; ')
            : (r.message as string)
          : message;
        code = (r.code as number | undefined) ?? status * 100;
      }
    } else if (isZodError(exception)) {
      // zod 校验失败统一映射为 400 Bad Request
      status = HttpStatus.BAD_REQUEST;
      code = 40000;
      message =
        (exception as { errors?: { message: string }[] }).errors
          ?.map((e) => e.message)
          .join('; ') ?? '参数校验失败';
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack ?? exception.message);
    }

    if (status >= 500) {
      this.logger.error(
        `[${traceId ?? '-'}] ${request.method} ${request.url} -> ${status}`,
        exception as Error,
      );
    }

    response.status(status).json({
      code,
      data: null,
      message,
      traceId,
    });
  }
}
