const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const idsToDelete = [
    'bab94243-acfe-445c-9ba4-31178c41794c',
    '869d13f9-e5b0-4c7a-9bb4-ec14063eb45c'
  ];

  console.log(`Attempting to delete ${idsToDelete.length} matches...`);
  
  for (const id of idsToDelete) {
    try {
      const deleted = await prisma.match.delete({
        where: { id }
      });
      console.log(`Successfully deleted match: ${id}`);
    } catch (e) {
      console.error(`Failed to delete match ${id}: ${e.message}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
