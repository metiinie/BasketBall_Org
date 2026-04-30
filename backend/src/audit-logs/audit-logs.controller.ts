import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createAuditLogDto: any) {
    return this.auditLogsService.create(createAuditLogDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('entity_id') entityId?: string) {
    return this.auditLogsService.findAll(entityId);
  }
}
