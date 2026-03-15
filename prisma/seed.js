const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  await prisma.ideaTag.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.tag.deleteMany();

  const raw = fs.readFileSync(
    path.join(__dirname, '../dev-data/ideas.json'),
    'utf-8'
  );
  const data = JSON.parse(raw);
  const ideas = data.actividades_santiago.ideas;

  for (const item of ideas) {
    const titulo = item.Idea || item.idea;
    if (!titulo) continue;

    const rawTags = item.etiquetas || [];
    const tagNames = rawTags
      .flatMap(t => t.split(',').map(s => s.trim()))
      .filter(Boolean);

    const tagRecords = [];
    for (const nombre of tagNames) {
      const tag = await prisma.tag.upsert({
        where: { nombre },
        update: {},
        create: { nombre }
      });
      tagRecords.push(tag);
    }

    await prisma.idea.create({
      data: {
        titulo,
        ubicacion: item.ubicacion || 'Santiago',
        tags: {
          create: tagRecords.map(tag => ({ tagId: tag.id }))
        }
      }
    });
  }

  const totalIdeas = await prisma.idea.count();
  const totalTags = await prisma.tag.count();
  console.log(`Seed completed: ${totalIdeas} ideas, ${totalTags} tags`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
