/**
 * Сид баннера, промокодов и советов дня.
 * npx tsx scripts/seed-home-content.ts
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_DAILY_TIPS, PROMO_CODES } from "../lib/home-content";
import { DEFAULT_BANNERS } from "../lib/home-data";

const prisma = new PrismaClient();

async function main() {
  const bannerCount = await prisma.homeBannerSlide.count();
  if (bannerCount === 0) {
    for (const [i, b] of DEFAULT_BANNERS.entries()) {
      await prisma.homeBannerSlide.create({
        data: {
          half: b.half,
          name: b.name,
          slug: b.slug,
          role: b.role,
          element: b.element,
          rarity: b.rarity,
          text: b.text,
          image: b.image,
          icon: b.icon,
          order: i,
          published: true,
        },
      });
    }
    console.log("banners seeded:", DEFAULT_BANNERS.length);
  } else {
    console.log("banners exist:", bannerCount);
  }

  const promoCount = await prisma.promoCode.count();
  if (promoCount === 0) {
    for (const [i, p] of PROMO_CODES.entries()) {
      await prisma.promoCode.create({
        data: {
          code: p.code,
          reward: p.reward,
          expiresAt: p.expiresAt ? new Date(p.expiresAt) : null,
          order: i,
          published: true,
        },
      });
    }
    console.log("promos seeded:", PROMO_CODES.length);
  } else {
    console.log("promos exist:", promoCount);
  }

  const tipCount = await prisma.dailyTip.count();
  if (tipCount === 0) {
    for (const [i, t] of DEFAULT_DAILY_TIPS.entries()) {
      await prisma.dailyTip.create({
        data: {
          title: t.title,
          body: t.body,
          order: i,
          published: true,
        },
      });
    }
    console.log("tips seeded:", DEFAULT_DAILY_TIPS.length);
  } else {
    console.log("tips exist:", tipCount);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
