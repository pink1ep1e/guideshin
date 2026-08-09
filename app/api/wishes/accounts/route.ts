import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";
import { resolveWishUser } from "@/lib/wish-auth";

export const WISH_SERVERS = [
  { id: "europe", label: "Европа" },
  { id: "asia", label: "Азия" },
  { id: "america", label: "Америка" },
  { id: "china", label: "Китай" },
] as const;

export type WishServerId = (typeof WISH_SERVERS)[number]["id"];

function normalizeServer(raw: unknown): WishServerId {
  const v = String(raw || "europe").toLowerCase();
  if (v === "asia" || v === "america" || v === "china" || v === "europe") {
    return v;
  }
  // paimon.moe values
  if (v === "eu" || v === "os_euro") return "europe";
  if (v === "os_asia" || v === "cht" || v === "tw") return "asia";
  if (v === "os_usa" || v === "na") return "america";
  if (v === "cn" || v === "cn_gf01" || v === "cn_qd01") return "china";
  return "europe";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await withPrisma(async (prisma) => {
    let list = await prisma.wishAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { pulls: true } } },
    });
    if (list.length === 0) {
      const created = await prisma.wishAccount.create({
        data: {
          userId: user.id,
          label: "Основной",
          server: "europe",
        },
      });
      list = [
        {
          ...created,
          _count: { pulls: 0 },
        },
      ];
    }
    return list;
  });

  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      label: a.label,
      uid: a.uid,
      server: a.server,
      pullCount: a._count.pulls,
    })),
    servers: WISH_SERVERS,
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    label?: string;
    server?: string;
    uid?: string;
  };

  const label = (body.label || "").trim() || "Новый аккаунт";
  const server = normalizeServer(body.server);
  const uid = body.uid?.trim() || null;

  const account = await withPrisma((prisma) =>
    prisma.wishAccount.create({
      data: { userId: user.id, label, server, uid },
    }),
  );

  return NextResponse.json({
    ok: true,
    account: {
      id: account.id,
      label: account.label,
      uid: account.uid,
      server: account.server,
      pullCount: 0,
    },
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    id?: string;
    label?: string;
    server?: string;
    uid?: string | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Укажите id аккаунта" }, { status: 400 });
  }

  const updated = await withPrisma(async (prisma) => {
    const existing = await prisma.wishAccount.findFirst({
      where: { id: body.id, userId: user.id },
    });
    if (!existing) return null;
    return prisma.wishAccount.update({
      where: { id: existing.id },
      data: {
        label:
          body.label !== undefined
            ? body.label.trim() || existing.label
            : undefined,
        server:
          body.server !== undefined ? normalizeServer(body.server) : undefined,
        uid: body.uid !== undefined ? body.uid?.trim() || null : undefined,
      },
    });
  });

  if (!updated) {
    return NextResponse.json({ error: "Аккаунт не найден" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    account: {
      id: updated.id,
      label: updated.label,
      uid: updated.uid,
      server: updated.server,
    },
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Укажите id" }, { status: 400 });
  }

  const result = await withPrisma(async (prisma) => {
    const count = await prisma.wishAccount.count({ where: { userId: user.id } });
    if (count <= 1) {
      return { error: "Нельзя удалить единственный аккаунт" as const };
    }
    const existing = await prisma.wishAccount.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return { error: "Аккаунт не найден" as const };
    await prisma.wishAccount.delete({ where: { id } });
    return { ok: true as const };
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
