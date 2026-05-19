import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const credentials = await prisma.credential.findMany({
    include: { user: { select: { email: true, fullName: true, roles: { include: { role: true } } } } }
  });
  console.log("=== CREDENTIALS ===");
  console.log(JSON.stringify(credentials, null, 2));

  const roles = await prisma.role.findMany();
  console.log("\n=== ROLES ===");
  console.log(JSON.stringify(roles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
