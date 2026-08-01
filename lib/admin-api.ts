import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import slugify from "slugify";
import { authOptions } from "@/lib/auth";
import { withPrisma } from "@/prisma/prisma-client";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
) {
  let slug = base;
  let i = 1;
  while (await exists(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export function makeSlug(name: string, explicit?: string) {
  return (
    explicit?.trim() ||
    slugify(name, { lower: true, strict: true, locale: "ru" }) ||
    slugify(name, { lower: true, strict: true }) ||
    `item-${Date.now()}`
  );
}

export { NextRequest, NextResponse, withPrisma };
