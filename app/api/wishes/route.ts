import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import {
  buildMonthlyPullChart,
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

  const monthlyChart = buildMonthlyPullChart(pullsForStats);

  const stats = computeAllBannerStats(pullsForStats).map((stat) => {
    const enriched = stat.fiveStars
      .map((row) => {
        const meta = resolveGuideMeta(
          row.name,
          row.itemType || "Character",
          guideIndex,
        );
        const displayName = meta?.name ?? row.name;
        const isWeapon = /weapon|оруж/i.test(row.itemType);
        const char = !isWeapon
          ? data.characters.find(
              (c) =>
                c.name.toLowerCase() === displayName.toLowerCase() ||
                meta?.slug === c.slug,
            )
          : null;
        const weapon = isWeapon
          ? data.weapons.find(
              (w) =>
                w.name.toLowerCase() === displayName.toLowerCase() ||
                meta?.slug === w.slug,
            )
          : null;
        const rarity =
          char?.rarity ??
          weapon?.rarity ??
          null;
        return {
          ...row,
          name: displayName,
          guideHref: meta?.href ?? null,
          image: meta?.image ?? (char?.image ?? weapon?.image ?? null),
          element: char?.element ?? null,
          rarity: rarity ?? "LEGEND",
        };
      })
      // Уже импортированные 4★ не показываем в истории 5★
      .filter((row) => row.rarity === "LEGEND");

    // Схлопываем EN/RU дубли после локализации имён
    const merged = new Map<string, (typeof enriched)[number]>();
    for (const row of enriched) {
      const isWeapon = /weapon|оруж/i.test(row.itemType);
      const key = `${isWeapon ? "w" : "c"}:${row.name.trim().toLowerCase()}`;
      const prev = merged.get(key);
      if (!prev) {
        merged.set(key, { ...row });
        continue;
      }
      prev.copies += row.copies;
      prev.constellation = isWeapon ? prev.copies : Math.max(0, prev.copies - 1);
      if (new Date(row.time) > new Date(prev.time)) {
        prev.pity = row.pity;
        prev.time = row.time;
        prev.image = row.image || prev.image;
        prev.guideHref = row.guideHref || prev.guideHref;
        prev.element = row.element || prev.element;
      }
    }

    return {
      ...stat,
      fiveStars: [...merged.values()].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
      ),
      last5StarHref: stat.last5Star
        ? resolveGuideHref(stat.last5Star, "Character", guideIndex)
        : null,
    };
  });

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
    monthlyChart,
    total: data.pulls.length,
    stats,
    recent,
    luck,
  });
}
