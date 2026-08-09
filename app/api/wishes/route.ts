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
import {
  buildCommunityLuck,
  computeFiftyFifty,
  snapshotFromPulls,
} from "@/lib/wish-luck";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestedAccountId = url.searchParams.get("accountId");

  const data = await withPrisma(async (prisma) => {
    let accounts = await prisma.wishAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });
    if (accounts.length === 0) {
      const created = await prisma.wishAccount.create({
        data: { userId: user.id, label: "Основной", server: "europe" },
      });
      accounts = [created];
    }

    const account =
      accounts.find((a) => a.id === requestedAccountId) || accounts[0];

    const [pulls, characters, weapons, allAccounts] = await Promise.all([
      prisma.wishPull.findMany({
        where: { accountId: account.id },
        orderBy: { wishTime: "desc" },
        take: 12000,
      }),
      prisma.character.findMany({
        where: { published: true },
        select: { slug: true, name: true, image: true, rarity: true, element: true },
      }),
      prisma.weapon.findMany({
        where: { published: true },
        select: { slug: true, name: true, image: true, rarity: true },
      }),
      prisma.wishAccount.findMany({
        where: { pulls: { some: {} } },
        take: 100,
        select: {
          id: true,
          pulls: {
            select: {
              hoyoId: true,
              gachaType: true,
              itemName: true,
              itemType: true,
              rankType: true,
              wishTime: true,
              raw: true,
            },
            take: 4000,
          },
        },
      }),
    ]);

    return { account, accounts, pulls, characters, weapons, allAccounts };
  });

  const guideIndex = buildGuideLinkIndex({
    characters: data.characters,
    weapons: data.weapons,
  });

  const pullsForStats = data.pulls.map((p) => ({
    ...p,
    raw: p.raw as { paimon_rate?: number } | null,
  }));

  const overview = computeWishOverview(pullsForStats);
  const fifty = computeFiftyFifty(pullsForStats);

  const pityChart = buildPityChart(pullsForStats).map((p) => {
    const meta = resolveGuideMeta(p.name, "Character", guideIndex);
    return {
      ...p,
      name: meta?.name ?? p.name,
      guideHref: meta?.href ?? null,
      image: meta?.image ?? null,
    };
  });

  const stats = computeAllBannerStats(pullsForStats).map((stat) => ({
    ...stat,
    fiveStars: stat.fiveStars.map((row) => {
      const meta = resolveGuideMeta(
        row.name,
        row.itemType || "Character",
        guideIndex,
      );
      const displayName = meta?.name ?? row.name;
      const char = data.characters.find(
        (c) =>
          c.name.toLowerCase() === displayName.toLowerCase() ||
          meta?.slug === c.slug,
      );
      return {
        ...row,
        name: displayName,
        guideHref: meta?.href ?? null,
        image: meta?.image ?? null,
        element: char?.element ?? null,
        rarity: char?.rarity ?? (/weapon|оруж/i.test(row.itemType) ? "LEGEND" : "LEGEND"),
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
      itemName: meta?.name ?? p.itemName,
      itemType: p.itemType,
      rankType: p.rankType,
      gachaType: p.gachaType,
      wishTime: p.wishTime.toISOString(),
      guideHref: meta?.href ?? null,
      image: meta?.image ?? null,
    };
  });

  const peerSnapshots = data.allAccounts.map((a) =>
    snapshotFromPulls(
      a.id,
      a.pulls.map((p) => ({
        ...p,
        raw: p.raw as { paimon_rate?: number } | null,
      })),
    ),
  );

  const luck = buildCommunityLuck(
    {
      total: overview.total,
      rate5: overview.rate5,
      rate4: overview.rate4,
      avgGarant5: overview.avgPity5,
      fifty,
    },
    peerSnapshots,
  );

  return NextResponse.json({
    account: {
      id: data.account.id,
      label: data.account.label,
      uid: data.account.uid,
      server: data.account.server,
    },
    accounts: data.accounts.map((a) => ({
      id: a.id,
      label: a.label,
      uid: a.uid,
      server: a.server,
    })),
    overview,
    fifty,
    pityChart,
    total: data.pulls.length,
    stats,
    recent,
    luck,
  });
}
