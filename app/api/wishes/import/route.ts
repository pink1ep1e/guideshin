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

async function parsePayloadWithPaimon(payload: unknown): Promise<NormalizedWish[]> {
  const catalog = await withPrisma(async (prisma) => {
    const [characters, weapons] = await Promise.all([
      prisma.character.findMany({
        where: { published: true },
        select: { slug: true, name: true, rarity: true },
      }),
      prisma.weapon.findMany({
        where: { published: true },
        select: { slug: true, name: true, rarity: true },
      }),
    ]);
    return { characters, weapons };
  });

  const lookup = buildPaimonRarityLookup(catalog);
  const paimon = parsePaimonMoeExport(payload, lookup);
  if (paimon.length > 0) return paimon;
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
    };

    const account = await getOrCreateAccount(user.id, body.accountId);
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
      const result = await fetchAllWishesFromAuthUrl(body.url || "");
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      pulls = result.pulls;
    } else if (body.mode === "json" || body.payload !== undefined) {
      pulls = await parsePayloadWithPaimon(body.payload);
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

    const inserted = await upsertPulls(account.id, pulls);
    return NextResponse.json({
      ok: true,
      totalParsed: pulls.length,
      inserted,
      accountId: account.id,
      accountLabel: account.label,
      accountServer: account.server,
    });
  } catch (e) {
    console.error("[wish import]", e);
    return NextResponse.json(
      { error: friendlyWishImportError(e) },
      { status: 500 },
    );
  }
}
