import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Диковинки без региона — почти все из Мондштадта в текущем наборе. */
async function main() {
  const result = await prisma.material.updateMany({
    where: {
      region: null,
      category: "local",
    },
    data: { region: "Мондштадт" },
  });
  console.log(`Updated region for ${result.count} local materials → Мондштадт`);

  const other = await prisma.material.updateMany({
    where: {
      region: null,
      NOT: { category: "local" },
    },
    data: { region: "Другое" },
  });
  console.log(`Updated region for ${other.count} other materials → Другое`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
