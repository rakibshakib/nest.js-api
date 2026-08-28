import { Injectable } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log(
      'DATABASE_URL:',
      process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'),
    );
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

    super({ adapter });
  }
}
