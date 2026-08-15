import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

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

  console.log('Super admin seeded successfully');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
