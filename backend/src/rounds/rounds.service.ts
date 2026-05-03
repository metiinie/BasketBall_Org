import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RoundStatus, TeamGender } from '@prisma/client';

const GENDER_MAP = {
  'ወንድ': TeamGender.MALE,
  'ሴት': TeamGender.FEMALE,
  'MALE': TeamGender.MALE,
  'FEMALE': TeamGender.FEMALE
};

@Injectable()
export class RoundsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService
  ) {}

  async create(createRoundDto: any, userId?: string) {
    if (createRoundDto.gender && GENDER_MAP[createRoundDto.gender]) {
      createRoundDto.gender = GENDER_MAP[createRoundDto.gender];
    }
    
    const round = await this.prisma.round.create({
      data: createRoundDto,
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'CREATE_ROUND',
      entity_id: round.id,
      details: createRoundDto,
    });

    return round;
  }

  findAll(seasonYear?: string, gender?: string) {
    const where: any = {};
    if (seasonYear) where.season_year = parseInt(seasonYear);
    
    const mappedGender = gender ? GENDER_MAP[gender] : undefined;
    if (mappedGender) where.gender = mappedGender;

    return this.prisma.round.findMany({
      where,
      orderBy: { round_number: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.round.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateRoundDto: any, userId?: string) {
    if (updateRoundDto.gender && GENDER_MAP[updateRoundDto.gender]) {
      updateRoundDto.gender = GENDER_MAP[updateRoundDto.gender];
    }

    // Enforcement: If setting to Active, deactivate others in same group
    if (updateRoundDto.status === RoundStatus.Active) {
      const current = await this.prisma.round.findUnique({ where: { id } });
      if (current) {
        await this.prisma.round.updateMany({
          where: {
            season_year: current.season_year,
            gender: current.gender,
            id: { not: id },
            status: RoundStatus.Active
          },
          data: { status: RoundStatus.Completed }
        });
      }
    }

    const round = await this.prisma.round.update({
      where: { id },
      data: updateRoundDto,
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'UPDATE_ROUND',
      entity_id: id,
      details: updateRoundDto,
    });

    return round;
  }

  async remove(id: string, userId?: string) {
    const existing = await this.prisma.round.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Round ${id} not found — it may have already been deleted.`);
    }

    const round = await this.prisma.round.delete({
      where: { id },
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'DELETE_ROUND',
      entity_id: id,
      details: { season_year: round.season_year, round_number: round.round_number },
    });

    return round;
  }
}
