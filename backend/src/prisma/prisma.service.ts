import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    let retries = 5;
    while (retries > 0) {
      try {
        await this.$connect();
        console.log('Successfully connected to the database');
        break;
      } catch (err) {
        retries -= 1;
        console.error(`Database connection failed. Retries left: ${retries}`, err.message);
        if (retries === 0) throw err;
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }
}
