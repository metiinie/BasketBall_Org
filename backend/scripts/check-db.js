const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teamsCount = await prisma.team.count();
  const roundsCount = await prisma.round.count();
  const matchesCount = await prisma.match.count();
  const auditLogsCount = await prisma.auditLog.count();

  console.log('--- DB Status ---');
  console.log(`Teams: ${teamsCount}`);
  console.log(`Rounds: ${roundsCount}`);
  console.log(`Matches: ${matchesCount}`);
  console.log(`Audit Logs: ${auditLogsCount}`);

  if (teamsCount > 0) {
    const sampleTeams = await prisma.team.findMany({ take: 5 });
    console.log('\nSample Teams:');
    sampleTeams.forEach(t => console.log(`- ${t.name} (${t.gender})`));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
