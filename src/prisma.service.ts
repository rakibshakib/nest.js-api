import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    const url = isProduction
      ? process.env.DATABASE_URL!
      : process.env.LOCAL_DB_URL!;
    const adapter = new PrismaPg({ connectionString: url });
    super({ adapter });
  }
}
