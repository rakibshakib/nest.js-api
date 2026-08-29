import { Injectable } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    const adapter = new PrismaMariaDb(
      {
        host: isProduction ? process.env.DB_HOST! : process.env.LOCAL_DB_HOST!,
        port: Number(
          isProduction ? process.env.DB_PORT! : process.env.LOCAL_DB_PORT!,
        ),
        user: isProduction ? process.env.DB_USER! : process.env.LOCAL_DB_USER!,
        password: isProduction
          ? process.env.DB_PASSWORD!
          : process.env.LOCAL_DB_PASSWORD!,
        database: isProduction
          ? process.env.DB_NAME!
          : process.env.LOCAL_DB_NAME!,
        ...(isProduction && {
          ssl: { rejectUnauthorized: true },
          connectTimeout: 30000,
        }),
      },
      { useTextProtocol: isProduction },
    );

    super({ adapter });
  }
}
