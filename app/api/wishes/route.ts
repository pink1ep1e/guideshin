import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import {
  buildPityChart,
  computeAllBannerStats,
  computeWishOverview,
} from "@/lib/wishes";
import {
  buildGuideLinkIndex,
  resolveGuideHref,
  resolveGuideMeta,
} from "@/lib/wish-guide-links";
import { resolveWishUser } from "@/lib/wish-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await withPrisma(async (prisma) => {
    let account = await prisma.wishAccount.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (!account) {
      account = await prisma.wishAccount.create({
        data: { userId: user.id, label: "Основной" },
      });
    }

    const [pulls, characters, weapons, totals, fives] = await Promise.all([
      prisma.wishPull.findMany({
        where: { accountId: account.id },
        orderBy: { wishTime: "desc" },
        take: 8000,
      }),
      prisma.character.findMany({
        where: { published: true },
        select: { slug: true, name: true, image: true },
      }),
      prisma.weapon.findMany({
        where: { published: true },
        select: { slug: true, name: true, image: true },
      }),
      prisma.wishPull.groupBy({
        by: ["accountId"],
        _count: { _all: true },
      }),
      prisma.wishPull.groupBy({
        by: ["accountId"],
        where: { rankType: "5" },
        _count: { _all: true },
      }),
    ]);

    return { account, pulls, characters, weapons, totals, fives };
  });

  const guideIndex = buildGuideLinkIndex({
    characters: data.characters,
    weapons: data.weapons,
  });

  const overview = computeWishOverview(data.pulls);
  const pityChart = buildPityChart(data.pulls).map((p) => {
    const meta = resolveGuideMeta(p.name, "Character", guideIndex);
    return {
      ...p,
      guideHref: meta?.href ?? null,
      image: meta?.image ?? null,
    };
  });

  const stats = computeAllBannerStats(data.pulls).map((stat) => ({
    ...stat,
    fiveStars: stat.fiveStars.map((row) => {
      const meta = resolveGuideMeta(
        row.name,
        row.itemType || "Character",
        guideIndex,
      );
      return {
        ...row,
        guideHref: meta?.href ?? null,
        image: meta?.image ?? null,
      };
    }),
    last5StarHref: stat.last5Star
      ? resolveGuideHref(stat.last5Star, "Character", guideIndex)
      : null,
  }));

  const recent = data.pulls.slice(0, 50).map((p) => {
    const meta = resolveGuideMeta(p.itemName, p.itemType, guideIndex);
    return {
      id: p.id,
      itemName: p.itemName,
      itemType: p.itemType,
      rankType: p.rankType,
      gachaType: p.gachaType,
      wishTime: p.wishTime.toISOString(),
      guideHref: meta?.href ?? null,
      image: meta?.image ?? null,
    };
  });

  // Сравнение удачи: ниже средний гарант 5★ ≈ удачливее
  const fiveByAccount = new Map(
    data.fives.map((r) => [r.accountId, r._count._all]),
  );
  const communityAvgs: number[] = [];
  for (const row of data.totals) {
    const five = fiveByAccount.get(row.accountId) ?? 0;
    if (five < 2 || row._count._all < 40) continue;
    communityAvgs.push(row._count._all / five);
  }
  communityAvgs.sort((a, b) => a - b);

  let luck = null as null | {
    sampleSize: number;
    communityAvgGarant: number;
    yourAvgGarant: number | null;
    luckierThanPercent: number | null;
    verdict: string;
  };

  if (communityAvgs.length >= 2) {
    const communityAvg =
      communityAvgs.reduce((a, b) => a + b, 0) / communityAvgs.length;
    const yours = overview.avgPity5;
    let luckierThanPercent: number | null = null;
    let verdict = "Пока мало данных для сравнения.";
    if (yours != null) {
      const worse = communityAvgs.filter((a) => a > yours).length;
      luckierThanPercent = Math.round((worse / communityAvgs.length) * 100);
      if (luckierThanPercent >= 70) {
        verdict = "Вы заметно удачливее большинства игроков Guideshin.";
      } else if (luckierThanPercent >= 45) {
        verdict = "Ваша удача около среднего уровня сообщества.";
      } else {
        verdict = "Пока сообщество в среднем выбивает 5★ раньше вас.";
      }
    }
    luck = {
      sampleSize: communityAvgs.length,
      communityAvgGarant: Number(communityAvg.toFixed(1)),
      yourAvgGarant: yours == null ? null : Number(yours.toFixed(1)),
      luckierThanPercent,
      verdict,
    };
  }

  return NextResponse.json({
    account: {
      id: data.account.id,
      label: data.account.label,
      uid: data.account.uid,
    },
    overview,
    pityChart,
    total: data.pulls.length,
    stats,
    recent,
    luck,
  });
}
