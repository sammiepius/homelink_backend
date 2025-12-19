import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@homelink.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@homelink.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Admin created:', admin);
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
