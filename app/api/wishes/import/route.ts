import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import {
  fetchAllWishesFromAuthUrl,
  parseWishImportPayload,
  type NormalizedWish,
} from "@/lib/wishes";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.kind !== "user") return null;
  return session.user.id;
}

async function ensureWishAccount(userId: string) {
  return withPrisma(async (prisma) => {
    const existing = await prisma.wishAccount.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing;
    return prisma.wishAccount.create({
      data: { userId, label: "Основной" },
    });
  });
}

async function upsertPulls(accountId: string, pulls: NormalizedWish[]) {
  let inserted = 0;
  await withPrisma(async (prisma) => {
    for (const pull of pulls) {
      try {
        await prisma.wishPull.create({
          data: {
            accountId,
            hoyoId: pull.hoyoId,
            gachaType: pull.gachaType,
            itemName: pull.itemName,
            itemType: pull.itemType,
            rankType: pull.rankType,
            wishTime: pull.wishTime,
            raw: pull.raw as object | undefined,
          },
        });
        inserted += 1;
      } catch {
        // unique conflict — skip
      }
    }
  });
  return inserted;
}

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      mode?: "url" | "json";
      url?: string;
      payload?: unknown;
    };

    const account = await ensureWishAccount(userId);
    let pulls: NormalizedWish[] = [];

    if (body.mode === "url" || body.url) {
      const result = await fetchAllWishesFromAuthUrl(body.url || "");
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      pulls = result.pulls;
    } else if (body.mode === "json" || body.payload !== undefined) {
      pulls = parseWishImportPayload(body.payload);
      if (pulls.length === 0) {
        return NextResponse.json(
          { error: "В JSON не найдено молитв. Экспортируйте историю из paimon.moe (UIGF/JSON)." },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json({ error: "Укажите url или payload" }, { status: 400 });
    }

    const inserted = await upsertPulls(account.id, pulls);
    return NextResponse.json({
      ok: true,
      totalParsed: pulls.length,
      inserted,
      accountId: account.id,
    });
  } catch (e) {
    console.error("[wish import]", e);
    return NextResponse.json({ error: "Ошибка импорта" }, { status: 500 });
  }
}
