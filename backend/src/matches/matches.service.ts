import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { MatchGateway } from './match.gateway';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService,
    private matchGateway: MatchGateway
  ) {}

  private validateMatchResult(data: any) {
    if (data.status === 'Completed' && data.home_score === data.away_score && data.home_score !== null) {
      throw new BadRequestException('Basketball matches cannot end in a draw. Please specify a winner or indicate OT.');
    }
  }

  async create(createMatchDto: any, userId?: string) {
    this.validateMatchResult(createMatchDto);

    const match = await this.prisma.match.create({
      data: createMatchDto,
      include: {
        home_team: true,
        away_team: true,
      },
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'CREATE_MATCH',
      entity_id: match.id,
      details: createMatchDto,
    });

    this.matchGateway.broadcastMatchUpdate(match.round_id, match);

    return match;
  }

  findAll(roundId?: string) {
    return this.prisma.match.findMany({
      where: roundId ? { round_id: roundId } : {},
      include: {
        home_team: true,
        away_team: true,
        round: true,
      },
      orderBy: { match_date: 'asc' },
    });
  }

  findCumulative(roundIds: string[]) {
    return this.prisma.match.findMany({
      where: {
        round_id: { in: roundIds },
      },
      include: {
        home_team: true,
        away_team: true,
        round: true,
      },
      orderBy: { match_date: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.match.findUnique({
      where: { id },
      include: {
        home_team: true,
        away_team: true,
      },
    });
  }

  async update(id: string, updateMatchDto: any, userId?: string) {
    // Merge existing data with update to validate
    const existing = await this.prisma.match.findUnique({ where: { id } });
    const merged = { ...existing, ...updateMatchDto };
    this.validateMatchResult(merged);

    const match = await this.prisma.match.update({
      where: { id },
      data: updateMatchDto,
      include: {
        home_team: true,
        away_team: true,
      },
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'UPDATE_MATCH',
      entity_id: id,
      details: updateMatchDto,
    });

    this.matchGateway.broadcastMatchUpdate(match.round_id, match);

    return match;
  }

  async remove(id: string, userId?: string) {
    const match = await this.prisma.match.delete({
      where: { id },
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'DELETE_MATCH',
      entity_id: id,
      details: { home_team_id: match.home_team_id, away_team_id: match.away_team_id },
    });

    return match;
  }
}
