import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import {
  fetchAllWishesFromAuthUrl,
  parseWishImportPayload,
  type NormalizedWish,
} from "@/lib/wishes";
import {
  buildPaimonRarityLookup,
  isPaimonMoeExport,
  parsePaimonMoeExport,
} from "@/lib/paimon-import";
import {
  friendlyWishImportError,
  resolveWishUser,
} from "@/lib/wish-auth";

export const maxDuration = 60;

async function getOrCreateAccount(userId: string, accountId?: string | null) {
  return withPrisma(async (prisma) => {
    if (accountId) {
      const found = await prisma.wishAccount.findFirst({
        where: { id: accountId, userId },
      });
      if (found) return found;
    }
    const existing = await prisma.wishAccount.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (existing) return existing;
    return prisma.wishAccount.create({
      data: { userId, label: "Основной", server: "europe" },
    });
  });
}

async function parsePayloadWithPaimon(payload: unknown): Promise<NormalizedWish[]> {
  if (isPaimonMoeExport(payload)) {
    const catalog = await withPrisma(async (prisma) => {
      const [characters, weapons] = await Promise.all([
        prisma.character.findMany({
          where: { published: true },
          select: { slug: true, name: true, rarity: true, image: true },
        }),
        prisma.weapon.findMany({
          where: { published: true },
          select: { slug: true, name: true, rarity: true, image: true },
        }),
      ]);
      return { characters, weapons };
    });
    const lookup = buildPaimonRarityLookup(catalog);
    return parsePaimonMoeExport(payload, lookup);
  }
  return parseWishImportPayload(payload);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json(
      {
        error:
          "Сессия устарела или аккаунт не найден. Выйдите и войдите снова.",
      },
      { status: 401 },
    );
  }

  try {
    const body = (await req.json()) as {
      mode?: "url" | "json" | "pulls";
      url?: string;
      payload?: unknown;
      pulls?: unknown;
      accountId?: string;
      /** Удалить текущие молитвы аккаунта перед импортом */
      replace?: boolean;
      source?: string;
      label?: string;
    };

    const account = await getOrCreateAccount(user.id, body.accountId);
    let pulls: NormalizedWish[] = [];
    let source = body.source || body.mode || "json";

    if (body.mode === "pulls" || Array.isArray(body.pulls)) {
      pulls = parseWishImportPayload(body.pulls ?? []);
      source = body.source || "pulls";
      if (pulls.length === 0) {
        return NextResponse.json(
          { error: "Пустой список молитв после разбора." },
          { status: 400 },
        );
      }
    } else if (body.mode === "url" || body.url) {
      const result = await fetchAllWishesFromAuthUrl(body.url || "");
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      pulls = result.pulls;
      source = "url";
    } else if (body.mode === "json" || body.payload !== undefined) {
      pulls = await parsePayloadWithPaimon(body.payload);
      source = isPaimonMoeExport(body.payload) ? "paimon" : "json";
      if (pulls.length === 0) {
        return NextResponse.json(
          {
            error:
              "В JSON не найдено молитв. Экспортируйте историю из paimon.moe (Settings → Download Data).",
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

    // paimon по умолчанию заменяет данные
    const replace =
      body.replace === true || (source === "paimon" && body.replace !== false);

    const result = await withPrisma(async (prisma) => {
      let previousPulls: unknown = null;
      if (replace) {
        const existing = await prisma.wishPull.findMany({
          where: { accountId: account.id },
          select: {
            hoyoId: true,
            gachaType: true,
            itemName: true,
            itemType: true,
            rankType: true,
            wishTime: true,
            raw: true,
          },
        });
        previousPulls = existing.length ? existing : null;
        await prisma.wishPull.deleteMany({ where: { accountId: account.id } });
      }

      const batch = await prisma.wishImportBatch.create({
        data: {
          accountId: account.id,
          source,
          label: body.label || null,
          pullCount: pulls.length,
          replacedPrevious: Boolean(replace && previousPulls),
          previousPulls: previousPulls as object | undefined,
        },
      });

      let inserted = 0;
      const chunk = 200;
      for (let i = 0; i < pulls.length; i += chunk) {
        const slice = pulls.slice(i, i + chunk);
        const created = await prisma.wishPull.createMany({
          data: slice.map((pull) => ({
            accountId: account.id,
            hoyoId: pull.hoyoId,
            gachaType: pull.gachaType,
            itemName: pull.itemName,
            itemType: pull.itemType,
            rankType: pull.rankType,
            wishTime: pull.wishTime,
            raw: (pull.raw as object | undefined) ?? undefined,
            importBatchId: batch.id,
          })),
          skipDuplicates: true,
        });
        inserted += created.count;
      }

      await prisma.wishImportBatch.update({
        where: { id: batch.id },
        data: { pullCount: inserted },
      });

      return { batchId: batch.id, inserted, replaced: Boolean(replace) };
    });

    return NextResponse.json({
      ok: true,
      totalParsed: pulls.length,
      inserted: result.inserted,
      accountId: account.id,
      accountLabel: account.label,
      accountServer: account.server,
      batchId: result.batchId,
      replaced: result.replaced,
    });
  } catch (e) {
    console.error("[wish import]", e);
    return NextResponse.json(
      { error: friendlyWishImportError(e) },
      { status: 500 },
    );
  }
}
