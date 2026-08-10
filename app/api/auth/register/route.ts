import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { withPrisma } from "@/prisma/prisma-client";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      nickname?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const name = body.name?.trim() || body.nickname?.trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Пароль не короче 8 символов" },
        { status: 400 },
      );
    }

    const existing = await withPrisma((prisma) =>
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
    );
    if (existing) {
      return NextResponse.json(
        { error: "Аккаунт с таким email уже есть" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await withPrisma((prisma) =>
      prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          wishAccounts: {
            create: { label: "Основной" },
          },
        },
        select: { id: true, email: true },
      }),
    );

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error("[register]", e);
    return NextResponse.json({ error: "Не удалось создать аккаунт" }, { status: 500 });
  }
}
