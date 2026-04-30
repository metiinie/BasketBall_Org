import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TeamsModule } from './teams/teams.module';
import { RoundsModule } from './rounds/rounds.module';
import { MatchesModule } from './matches/matches.module';
import { PrismaModule } from './prisma/prisma.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    PrismaModule,
    TeamsModule,
    RoundsModule,
    MatchesModule,
    SnapshotsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
