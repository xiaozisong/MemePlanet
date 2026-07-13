import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './database/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { UserModule } from './modules/user/user.module';
import { MemeModule } from './modules/meme/meme.module';
import { CreationModule } from './modules/creation/creation.module';
import { VideoModule } from './modules/video/video.module';
import { RatingModule } from './modules/rating/rating.module';
import { LegionModule } from './modules/legion/legion.module';
import { PKModule } from './modules/pk/pk.module';
import { ChatModule } from './modules/chat/chat.module';
import { RecommendModule } from './modules/recommend/recommend.module';
import { AuditModule } from './modules/audit/audit.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AIOrchModule } from './modules/ai-orch/ai-orch.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      expandVariables: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UserModule,
    MemeModule,
    CreationModule,
    VideoModule,
    RatingModule,
    LegionModule,
    PKModule,
    ChatModule,
    RecommendModule,
    AuditModule,
    AdminModule,
    NotificationModule,
    AnalyticsModule,
    AIOrchModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
