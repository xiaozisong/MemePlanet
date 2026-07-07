import { Module, Global } from '@nestjs/common';
import { DrizzleModule } from './drizzle.module.js';

@Global()
@Module({
  imports: [DrizzleModule],
  exports: [DrizzleModule],
})
export class DatabaseModule {}
