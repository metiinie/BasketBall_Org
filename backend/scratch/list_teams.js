const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Listing all teams in database...');
  const teams = await prisma.team.findMany();
  teams.forEach(t => {
    console.log(`- [${t.id}] ${t.name} (${t.gender})`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
