import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import {
  buildMonthlyPullChart,
  computeAllBannerStats,
  computeWishOverview,
  dedupeWishPulls,
  syntheticDuplicateDbIds,
} from "@/lib/wishes";
import {
  buildGuideLinkIndex,
  buildCatalogRankIndex,
  applyCatalogRanksToPulls,
  localizeWishDisplayName,
  isForcedFourStarName,
  resolveGuideHref,
  resolveGuideMeta,
} from "@/lib/wish-guide-links";
import { resolveWishUser } from "@/lib/wish-auth";
import { computeFiftyFifty } from "@/lib/wish-luck";
import { loadWishGuideCatalog } from "@/lib/wish-catalog-cache";

const PULL_SELECT = {
  id: true,
  hoyoId: true,
  gachaType: true,
  itemName: true,
  itemType: true,
  rankType: true,
  wishTime: true,
  raw: true,
} as const;

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
      select: {
        id: true,
        label: true,
        uid: true,
        server: true,
        avatarUrl: true,
      },
    });
    if (accounts.length === 0) {
      const created = await prisma.wishAccount.create({
        data: { userId: user.id, label: "Основной", server: "europe" },
        select: {
          id: true,
          label: true,
          uid: true,
          server: true,
          avatarUrl: true,
        },
      });
      accounts = [created];
    }

    const account =
      accounts.find((a) => a.id === requestedAccountId) || accounts[0];

    const [pulls, catalog] = await Promise.all([
      prisma.wishPull.findMany({
        where: { accountId: account.id },
        orderBy: { wishTime: "desc" },
        take: 12000,
        select: PULL_SELECT,
      }),
      loadWishGuideCatalog(prisma),
    ]);

    const stale = syntheticDuplicateDbIds(pulls);
    if (stale.length) {
      await prisma.wishPull.deleteMany({ where: { id: { in: stale } } });
    }

    const pullsClean = stale.length
      ? pulls.filter((p) => !stale.includes(p.id))
      : pulls;

    return {
      account,
      accounts,
      pulls: pullsClean,
      characters: catalog.characters,
      weapons: catalog.weapons,
      defaultAvatarUrl: catalog.defaultAvatarUrl,
    };
  });

  const guideIndex = buildGuideLinkIndex({
    characters: data.characters,
    weapons: data.weapons,
  });

  const rankIndex = buildCatalogRankIndex({
    characters: data.characters,
    weapons: data.weapons,
  });

  const charByName = new Map(
    data.characters.map((c) => [c.name.toLowerCase(), c] as const),
  );
  const charBySlug = new Map(data.characters.map((c) => [c.slug, c] as const));
  const weaponByName = new Map(
    data.weapons.map((w) => [w.name.toLowerCase(), w] as const),
  );
  const weaponBySlug = new Map(data.weapons.map((w) => [w.slug, w] as const));

  const pullsForStats = applyCatalogRanksToPulls(
    dedupeWishPulls(
      data.pulls.map((p) => ({
        ...p,
        raw: p.raw as { paimon_rate?: number } | null,
      })),
    ),
    rankIndex,
  );

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
        const displayName =
          meta?.name ?? localizeWishDisplayName(row.name);
        const isWeapon = /weapon|оруж/i.test(row.itemType);
        const char = !isWeapon
          ? (meta?.slug ? charBySlug.get(meta.slug) : undefined) ||
            charByName.get(displayName.toLowerCase())
          : null;
        const weapon = isWeapon
          ? (meta?.slug ? weaponBySlug.get(meta.slug) : undefined) ||
            weaponByName.get(displayName.toLowerCase())
          : null;
        const catalogRarity = char?.rarity ?? weapon?.rarity ?? null;
        const forcedFour =
          !isWeapon &&
          (isForcedFourStarName(displayName) || isForcedFourStarName(row.name));

        const rarity =
          forcedFour ||
          catalogRarity === "EPIC" ||
          catalogRarity === "RARE" ||
          catalogRarity === "COMMON"
            ? catalogRarity || "EPIC"
            : "LEGEND";

        return {
          ...row,
          name: displayName,
          guideHref: meta?.href ?? null,
          image: meta?.image ?? (char?.image ?? weapon?.image ?? null),
          element: char?.element ?? null,
          rarity,
        };
      })
      .filter((row) => row.rarity === "LEGEND");

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

  const recent = pullsForStats.slice(0, 40).map((p) => {
    const meta = resolveGuideMeta(p.itemName, p.itemType, guideIndex);
    return {
      id: (p as { id?: string }).id || p.hoyoId,
      itemName: meta?.name ?? localizeWishDisplayName(p.itemName),
      itemType: p.itemType,
      rankType: p.rankType,
      gachaType: p.gachaType,
      wishTime: new Date(p.wishTime).toISOString(),
      guideHref: meta?.href ?? null,
      image: meta?.image ?? null,
    };
  });

  return NextResponse.json({
    account: {
      id: data.account.id,
      label: data.account.label,
      uid: data.account.uid,
      server: data.account.server,
      avatarUrl: data.account.avatarUrl,
    },
    accounts: data.accounts.map((a) => ({
      id: a.id,
      label: a.label,
      uid: a.uid,
      server: a.server,
      avatarUrl: a.avatarUrl,
    })),
    defaultAvatarUrl: data.defaultAvatarUrl,
    overview,
    fifty,
    monthlyChart,
    total: pullsForStats.length,
    stats,
    recent,
    luck: null,
  });
}
