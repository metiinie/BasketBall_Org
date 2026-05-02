import { Module } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [RoundsController],
  providers: [RoundsService],
})
export class RoundsModule {}
