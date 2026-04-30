import { Module } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { RoundsController } from './rounds.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule],
  controllers: [RoundsController],
  providers: [RoundsService],
})
export class RoundsModule {}
