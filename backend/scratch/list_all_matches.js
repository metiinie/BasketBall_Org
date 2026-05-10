const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Listing all matches with their team names...');
  const matches = await prisma.match.findMany({
    include: {
      home_team: true,
      away_team: true,
    }
  });

  matches.forEach(m => {
    console.log(`- [${m.id}] ${m.home_team.name} vs ${m.away_team.name} | Status: ${m.status} | Date: ${m.match_date}`);
  });
  
  console.log(`\nTotal matches: ${matches.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
