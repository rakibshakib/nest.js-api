import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';

const isProduction = process.env.NODE_ENV === 'production';
const url = isProduction
  ? process.env.DATABASE_URL!
  : process.env.LOCAL_DB_URL!;
const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash('12345678', 10);
  const user = await prisma.user.upsert({
    where: { email: 'superadmin@gmail.com' },
    update: { name: 'Admin', userType: 'ADMIN', password: hashedPassword },
    create: {
      name: 'Admin',
      email: 'superadmin@gmail.com',
      password: hashedPassword,
      userType: 'ADMIN',
    },
  });
  await prisma.admin.upsert({
    where: { userId: user.id },
    update: { role: 'SUPER_ADMIN' },
    create: { userId: user.id, role: 'SUPER_ADMIN' },
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
