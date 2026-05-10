const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking database for matches...');
  const matches = await prisma.match.findMany({
    include: {
      home_team: true,
      away_team: true,
    }
  });

  console.log(`Found ${matches.length} matches total.`);
  
  const suspiciousMatches = matches.filter(m => {
    const home = m.home_team.name;
    const away = m.away_team.name;
    return (
      (home.includes('Ethiopian') || away.includes('Ethiopian')) ||
      (home.includes('Gambella') || away.includes('Gambella')) ||
      (home.includes('Sheger') || away.includes('Sheger')) ||
      (home.includes('Hawassa') || away.includes('Hawassa'))
    );
  });

  if (suspiciousMatches.length > 0) {
    console.log('Found matching records in Database:');
    suspiciousMatches.forEach(m => {
      console.log(`- [${m.id}] ${m.home_team.name} vs ${m.away_team.name} | Status: ${m.status} | Date: ${m.match_date}`);
    });
  } else {
    console.log('No matches found in database matching those team names.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
