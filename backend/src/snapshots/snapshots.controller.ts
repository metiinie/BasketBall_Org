import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSnapshotDto: any) {
    return this.snapshotsService.upsert(createSnapshotDto.round_id, createSnapshotDto.historical_standings_json);
  }

  @Get('round/:roundId')
  findOne(@Param('roundId') roundId: string) {
    return this.snapshotsService.findOneByRound(roundId);
  }
}
