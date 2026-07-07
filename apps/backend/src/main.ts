import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3000);
  const env = config.get<string>('NODE_ENV', 'development');

  // Sentry
  const sentryDsn = config.get<string>('SENTRY_DSN');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: env,
      tracesSampleRate: env === 'production' ? 0.2 : 1.0,
    });
  }

  // 全局前缀
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // CORS
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') ?? '*').split(','),
    credentials: true,
  });

  // 全局管道 / 过滤器 / 拦截器
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MemeChatAI API')
    .setDescription('梗星球 MemeChatAI 后端 API（契约文档见 docs/openapi.yaml）')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { url: '/api-docs.yaml' },
  });

  // 健康检查
  app.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), env, version: '0.1.0' });
  });

  await app.listen(port);
  Logger.log(`🚀 Backend running on http://localhost:${port} (${env})`, 'Bootstrap');
  Logger.log(`📚 Swagger UI:  http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
