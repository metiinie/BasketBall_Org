import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SnapshotsService {
  constructor(private prisma: PrismaService) {}

  upsert(roundId: string, historicalStandingsJson: any) {
    return this.prisma.roundSnapshot.upsert({
      where: { round_id: roundId },
      update: { historical_standings_json: historicalStandingsJson },
      create: {
        round_id: roundId,
        historical_standings_json: historicalStandingsJson,
      },
    });
  }

  findOneByRound(roundId: string) {
    return this.prisma.roundSnapshot.findUnique({
      where: { round_id: roundId },
    });
  }
}
