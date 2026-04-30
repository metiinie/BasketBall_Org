import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTeamDto: any, @Req() req: any) {
    return this.teamsService.create(createTeamDto, req.user?.userId);
  }

  @Get()
  findAll(@Query('gender') gender?: string) {
    return this.teamsService.findAll(gender);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateTeamDto: any, @Req() req: any) {
    return this.teamsService.update(id, updateTeamDto, req.user?.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.teamsService.remove(id, req.user?.userId);
  }
}
