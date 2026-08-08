import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import { computeAllBannerStats } from "@/lib/wishes";
import {
  buildGuideLinkIndex,
  resolveGuideHref,
} from "@/lib/wish-guide-links";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.kind !== "user") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await withPrisma(async (prisma) => {
    let account = await prisma.wishAccount.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    if (!account) {
      account = await prisma.wishAccount.create({
        data: { userId: session.user.id, label: "Основной" },
      });
    }

    const [pulls, characters, weapons] = await Promise.all([
      prisma.wishPull.findMany({
        where: { accountId: account.id },
        orderBy: { wishTime: "desc" },
        take: 5000,
      }),
      prisma.character.findMany({
        where: { published: true },
        select: { slug: true, name: true },
      }),
      prisma.weapon.findMany({
        where: { published: true },
        select: { slug: true, name: true },
      }),
    ]);

    return { account, pulls, characters, weapons };
  });

  const guideIndex = buildGuideLinkIndex({
    characters: data.characters,
    weapons: data.weapons,
  });

  const stats = computeAllBannerStats(data.pulls).map((stat) => ({
    ...stat,
    fiveStars: stat.fiveStars.map((row) => ({
      ...row,
      guideHref: resolveGuideHref(row.name, "Character", guideIndex),
    })),
    last5StarHref: stat.last5Star
      ? resolveGuideHref(stat.last5Star, "Character", guideIndex)
      : null,
  }));

  const recent = data.pulls.slice(0, 40).map((p) => ({
    id: p.id,
    itemName: p.itemName,
    itemType: p.itemType,
    rankType: p.rankType,
    gachaType: p.gachaType,
    wishTime: p.wishTime.toISOString(),
    guideHref: resolveGuideHref(p.itemName, p.itemType, guideIndex),
  }));

  return NextResponse.json({
    account: {
      id: data.account.id,
      label: data.account.label,
      uid: data.account.uid,
    },
    total: data.pulls.length,
    stats,
    recent,
  });
}
