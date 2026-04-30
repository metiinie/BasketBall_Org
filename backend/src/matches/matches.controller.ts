import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createMatchDto: any, @Req() req: any) {
    return this.matchesService.create(createMatchDto, req.user?.userId);
  }

  @Get()
  findAll(@Query('round_id') roundId?: string) {
    return this.matchesService.findAll(roundId);
  }

  @Get('cumulative')
  findCumulative(@Query('round_ids') roundIds?: string) {
    const ids = roundIds ? roundIds.split(',') : [];
    return this.matchesService.findCumulative(ids);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateMatchDto: any, @Req() req: any) {
    return this.matchesService.update(id, updateMatchDto, req.user?.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.matchesService.remove(id, req.user?.userId);
  }
}
