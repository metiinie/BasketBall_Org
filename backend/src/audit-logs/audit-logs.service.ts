import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private prisma: PrismaService) {}

  create(createAuditLogDto: any) {
    return this.prisma.auditLog.create({
      data: createAuditLogDto,
    });
  }

  findAll(entityId?: string) {
    return this.prisma.auditLog.findMany({
      where: entityId ? { entity_id: entityId } : {},
      orderBy: { created_at: 'desc' },
      take: 100,
    });
  }
}
