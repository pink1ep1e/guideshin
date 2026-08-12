import type { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import {
  computeWishOverview,
  dedupeWishPulls,
} from "@/lib/wishes";
import { resolveWishUser } from "@/lib/wish-auth";
import {
  buildCommunityLuck,
  buildWishAchievements,
  computeFiftyFifty,
  computeFiftyFiftyStreaks,
  snapshotFromPulls,
  type AccountLuckSnapshot,
} from "@/lib/wish-luck";
import {
  getCachedPeerSnapshots,
  setCachedPeerSnapshots,
} from "@/lib/wish-catalog-cache";

const PULL_SELECT = {
  hoyoId: true,
  gachaType: true,
  itemName: true,
  itemType: true,
  rankType: true,
  wishTime: true,
  raw: true,
} as const;

async function loadPeerSnapshots(
  prisma: PrismaClient,
  excludeAccountId: string,
): Promise<AccountLuckSnapshot[]> {
  const cached = getCachedPeerSnapshots();
  if (cached) {
    return cached.filter((p) => p.accountId !== excludeAccountId);
  }

  const accounts = await prisma.wishAccount.findMany({
    where: { pulls: { some: {} } },
    take: 50,
    select: {
      id: true,
      pulls: {
        select: PULL_SELECT,
        take: 3000,
        orderBy: { wishTime: "desc" },
      },
    },
  });

  const peers = accounts.map((a) =>
    snapshotFromPulls(
      a.id,
      dedupeWishPulls(
        a.pulls.map((p) => ({
          ...p,
          raw: p.raw as { paimon_rate?: number } | null,
        })),
      ),
    ),
  );
  setCachedPeerSnapshots(peers);
  return peers.filter((p) => p.accountId !== excludeAccountId);
}

/** Достижения + удача сообщества — лениво после основного кабинета. */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) {
    return NextResponse.json({ error: "Укажите accountId" }, { status: 400 });
  }

  const payload = await withPrisma(async (prisma) => {
    const account = await prisma.wishAccount.findFirst({
      where: { id: accountId, userId: user.id },
      select: { id: true },
    });
    if (!account) return null;

    const pulls = await prisma.wishPull.findMany({
      where: { accountId: account.id },
      orderBy: { wishTime: "desc" },
      take: 12000,
      select: PULL_SELECT,
    });

    const cleaned = dedupeWishPulls(
      pulls.map((p) => ({
        ...p,
        raw: p.raw as { paimon_rate?: number } | null,
      })),
    );
    const overview = computeWishOverview(cleaned);
    const fifty = computeFiftyFifty(cleaned);
    const streaks = computeFiftyFiftyStreaks(cleaned);
    const peers = await loadPeerSnapshots(prisma, account.id);
    const luck = buildCommunityLuck(
      {
        total: overview.total,
        rate5: overview.rate5,
        rate4: overview.rate4,
        avgGarant5: overview.avgPity5,
        fifty,
      },
      peers,
    );

    return {
      luck,
      achievements: buildWishAchievements(luck, streaks),
    };
  });

  if (!payload) {
    return NextResponse.json({ error: "Аккаунт не найден" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
