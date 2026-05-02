import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { MatchGateway } from './match.gateway';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuditLogsModule, AuthModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchGateway],
  exports: [MatchesService, MatchGateway],
})
export class MatchesModule {}
