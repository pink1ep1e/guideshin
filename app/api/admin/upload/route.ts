import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export const runtime = "nodejs";

const FOLDERS = {
  icon: "uploads/icons",
  splash: "uploads/splash",
  weapon: "uploads/weapons",
  artifact: "uploads/artifacts",
  material: "uploads/materials",
  video: "uploads/videos",
  other: "uploads/other",
} as const;

type UploadKind = keyof typeof FOLDERS;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/gif",
]);

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

const IMAGE_MAX_EDGE: Record<UploadKind, number> = {
  icon: 512,
  splash: 1600,
  weapon: 800,
  artifact: 800,
  material: 800,
  video: 0,
  other: 1600,
};

async function optimizeImage(
  buffer: Buffer,
  kind: UploadKind,
): Promise<{ data: Buffer; ext: string }> {
  const max = IMAGE_MAX_EDGE[kind] || 1600;
  const data = await sharp(buffer)
    .rotate()
    .resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();
  return { data, ext: ".webp" };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const kindRaw = String(form.get("kind") || "other");
  const kind = (kindRaw in FOLDERS ? kindRaw : "other") as UploadKind;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const isVideo = kind === "video";
  const allowed = isVideo ? VIDEO_TYPES : IMAGE_TYPES;
  if (!allowed.has(file.type)) {
    return NextResponse.json(
      { error: isVideo ? "Нужен mp4/webm/gif" : "Нужен jpg/png/webp/gif" },
      { status: 400 },
    );
  }

  const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
  if (file.size > max) {
    return NextResponse.json({ error: "Файл слишком большой" }, { status: 400 });
  }

  const folder = FOLDERS[kind];
  const dir = path.join(process.cwd(), "public", folder);
  await mkdir(dir, { recursive: true });

  const raw = Buffer.from(await file.arrayBuffer());
  let out: Buffer = raw;
  let ext =
    path.extname(file.name).toLowerCase() ||
    (file.type === "image/gif"
      ? ".gif"
      : file.type === "image/png"
        ? ".png"
        : ".bin");

  if (file.type !== "image/gif" && !isVideo) {
    try {
      const optimized = await optimizeImage(raw, kind);
      out = optimized.data;
      ext = optimized.ext;
    } catch {
      // keep original on sharp failure
    }
  }

  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`;
  await writeFile(path.join(dir, filename), out);

  const url = `/${folder}/${filename}`.replace(/\\/g, "/");
  return NextResponse.json({ url, kind, name: file.name, size: out.length });
}
