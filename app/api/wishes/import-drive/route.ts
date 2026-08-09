import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveWishUser } from "@/lib/wish-auth";

function extractDriveFileId(raw: string): string | null {
  const trimmed = raw.trim();
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/uc\?.*?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m?.[1]) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) return trimmed;
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = await resolveWishUser(session);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { url?: string };
    const fileId = extractDriveFileId(body.url || "");
    if (!fileId) {
      return NextResponse.json(
        {
          error:
            "Не распознали ссылку Google Drive. Нужен файл вида drive.google.com/file/d/…",
        },
        { status: 400 },
      );
    }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const res = await fetch(downloadUrl, {
      redirect: "follow",
      headers: { Accept: "application/json,text/plain,*/*" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            "Не удалось скачать файл. Откройте доступ «Все, у кого есть ссылка» и попробуйте снова.",
        },
        { status: 400 },
      );
    }

    const text = await res.text();
    if (/<!doctype html|<html/i.test(text.slice(0, 200))) {
      return NextResponse.json(
        {
          error:
            "Google вернул страницу вместо JSON. Сделайте файл публичным по ссылке или загрузите JSON вручную.",
        },
        { status: 400 },
      );
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Файл не является JSON. Экспортируйте данные из paimon.moe." },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, payload });
  } catch (e) {
    console.error("[wish import-drive]", e);
    return NextResponse.json(
      { error: "Ошибка загрузки с Google Drive" },
      { status: 500 },
    );
  }
}
