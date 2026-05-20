import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    }
  });
  console.log('--- USERS ---');
  console.log(JSON.stringify(users, null, 2));

  const techs = await prisma.technicianProfile.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        }
      }
    }
  });
  console.log('--- TECHNICIANS ---');
  console.log(JSON.stringify(techs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
