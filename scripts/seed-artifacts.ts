import { PrismaClient } from "@prisma/client";
import {
  ARTIFACT_SEED,
  artifactImagePath,
  rarityStarsToEnum,
} from "../lib/artifact-seed";

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  let updated = 0;

  for (let i = 0; i < ARTIFACT_SEED.length; i++) {
    const a = ARTIFACT_SEED[i];
    const image = artifactImagePath(a.img);
    const rarity = rarityStarsToEnum(a.rarity);

    const result = await prisma.artifact.upsert({
      where: { slug: a.slug },
      create: {
        slug: a.slug,
        name: a.name,
        image,
        rarity,
        region: a.region,
        contentHtml: "",
        published: true,
        order: i,
      },
      update: {
        name: a.name,
        image,
        rarity,
        region: a.region,
        published: true,
        order: i,
      },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
    else updated++;
  }

  const total = await prisma.artifact.count();
  console.log(`Artifacts seeded. created≈${created}, updated≈${updated}, total=${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
