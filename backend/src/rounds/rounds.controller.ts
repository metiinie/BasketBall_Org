import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { RoundsService } from './rounds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createRoundDto: any, @Req() req: any) {
    return this.roundsService.create(createRoundDto, req.user?.userId);
  }

  @Get()
  findAll(
    @Query('season_year') seasonYear?: string,
    @Query('gender') gender?: string,
  ) {
    return this.roundsService.findAll(seasonYear, gender);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roundsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateRoundDto: any, @Req() req: any) {
    return this.roundsService.update(id, updateRoundDto, req.user?.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.roundsService.remove(id, req.user?.userId);
  }
}
