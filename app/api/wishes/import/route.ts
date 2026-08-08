import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import {
  fetchAllWishesFromAuthUrl,
  parseWishImportPayload,
  type NormalizedWish,
} from "@/lib/wishes";

export const maxDuration = 60;

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

function toDbRows(accountId: string, pulls: NormalizedWish[]) {
  return pulls.map((pull) => ({
    accountId,
    hoyoId: pull.hoyoId,
    gachaType: pull.gachaType,
    itemName: pull.itemName,
    itemType: pull.itemType,
    rankType: pull.rankType,
    wishTime: pull.wishTime,
    raw: (pull.raw as object | undefined) ?? undefined,
  }));
}

async function upsertPulls(accountId: string, pulls: NormalizedWish[]) {
  if (pulls.length === 0) return 0;

  let inserted = 0;
  const rows = toDbRows(accountId, pulls);

  await withPrisma(async (prisma) => {
    const chunk = 200;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const result = await prisma.wishPull.createMany({
        data: slice,
        skipDuplicates: true,
      });
      inserted += result.count;
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
      mode?: "url" | "json" | "pulls";
      url?: string;
      payload?: unknown;
      pulls?: unknown;
    };

    const account = await ensureWishAccount(userId);
    let pulls: NormalizedWish[] = [];

    if (body.mode === "pulls" || Array.isArray(body.pulls)) {
      pulls = parseWishImportPayload(body.pulls ?? []);
      if (pulls.length === 0) {
        return NextResponse.json(
          { error: "Пустой список молитв после разбора." },
          { status: 400 },
        );
      }
    } else if (body.mode === "url" || body.url) {
      // Fallback: серверный fetch (предпочтительно клиент шлёт mode=pulls)
      const result = await fetchAllWishesFromAuthUrl(body.url || "");
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      pulls = result.pulls;
    } else if (body.mode === "json" || body.payload !== undefined) {
      pulls = parseWishImportPayload(body.payload);
      if (pulls.length === 0) {
        return NextResponse.json(
          {
            error:
              "В JSON не найдено молитв. Экспортируйте историю из paimon.moe (UIGF/JSON).",
          },
          { status: 400 },
        );
      }
    } else {
      return NextResponse.json(
        { error: "Укажите url, pulls или payload" },
        { status: 400 },
      );
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
    const detail = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      {
        error: `Ошибка импорта: ${detail}. Если ссылка свежая — попробуйте ещё раз.`,
      },
      { status: 500 },
    );
  }
}
