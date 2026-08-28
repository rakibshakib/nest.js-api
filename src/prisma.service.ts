import { Injectable } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const databaseUrl = new URL(process.env.DATABASE_URL!);

    const isProduction = process.env.NODE_ENV === 'production';

    const adapter = new PrismaMariaDb({
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port),
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password),
      database: databaseUrl.pathname.substring(1),

      ...(isProduction && {
        ssl: {
          rejectUnauthorized: true,
        },
      }),
    });

    super({ adapter });
  }
}
