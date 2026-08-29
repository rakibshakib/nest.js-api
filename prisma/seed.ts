import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

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
    database: isProduction ? process.env.DB_NAME! : process.env.LOCAL_DB_NAME!,
    ...(isProduction && {
      ssl: { rejectUnauthorized: true },
      connectTimeout: 30000,
    }),
  },
  { useTextProtocol: isProduction },
);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const hashedPassword = await bcrypt.hash('12345678', 10);

  // Create or update super admin user
  const user = await prisma.user.upsert({
    where: {
      email: 'superadmin@gmail.com',
    },
    update: {
      name: 'Admin',
      userType: 'ADMIN',
      password: hashedPassword,
    },
    create: {
      name: 'Admin',
      email: 'superadmin@gmail.com',
      password: hashedPassword,
      userType: 'ADMIN',
    },
  });

  // Create or update admin profile
  await prisma.admin.upsert({
    where: {
      userId: user.id,
    },
    update: {
      role: 'SUPER_ADMIN',
    },
    create: {
      userId: user.id,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(
    `Super admin seeded successfully (${isProduction ? 'production' : 'development'})`,
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
