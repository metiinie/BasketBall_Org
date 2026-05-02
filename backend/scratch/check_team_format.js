const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({ take: 1 });
  console.log(JSON.stringify(teams, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
