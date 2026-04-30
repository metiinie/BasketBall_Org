import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { TeamGender } from '@prisma/client';

const GENDER_MAP = {
  'ወንድ': TeamGender.MALE,
  'ሴት': TeamGender.FEMALE,
  'MALE': TeamGender.MALE,
  'FEMALE': TeamGender.FEMALE
};

@Injectable()
export class TeamsService {
  constructor(
    private prisma: PrismaService,
    private auditLogs: AuditLogsService
  ) {}

  async create(createTeamDto: any, userId?: string) {
    if (createTeamDto.gender && GENDER_MAP[createTeamDto.gender]) {
      createTeamDto.gender = GENDER_MAP[createTeamDto.gender];
    }
    const team = await this.prisma.team.create({
      data: createTeamDto,
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'CREATE_TEAM',
      entity_id: team.id,
      details: createTeamDto,
    });

    return team;
  }

  findAll(gender?: string) {
    const mappedGender = gender ? GENDER_MAP[gender] : undefined;
    return this.prisma.team.findMany({
      where: mappedGender ? { gender: mappedGender } : {},
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.team.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateTeamDto: any, userId?: string) {
    if (updateTeamDto.gender && GENDER_MAP[updateTeamDto.gender]) {
      updateTeamDto.gender = GENDER_MAP[updateTeamDto.gender];
    }
    const team = await this.prisma.team.update({
      where: { id },
      data: updateTeamDto,
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'UPDATE_TEAM',
      entity_id: id,
      details: updateTeamDto,
    });

    return team;
  }

  async remove(id: string, userId?: string) {
    const team = await this.prisma.team.delete({
      where: { id },
    });

    await this.auditLogs.create({
      user_id: userId,
      action: 'DELETE_TEAM',
      entity_id: id,
      details: { team_name: team.name },
    });

    return team;
  }
}
