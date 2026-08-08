import type { MetadataRoute } from "next";
import { withPrisma } from "@/prisma/prisma-client";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: absoluteUrl("/wiki/characters"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/wiki/weapons"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/wiki/artifacts"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/wiki/materials"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/map"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const data = await withPrisma(async (prisma) => {
    const [characters, weapons, artifacts, materials] = await Promise.all([
      prisma.character.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.weapon.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.artifact.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.material.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    return { characters, weapons, artifacts, materials };
  }).catch(() => ({
    characters: [] as { slug: string; updatedAt: Date }[],
    weapons: [] as { slug: string; updatedAt: Date }[],
    artifacts: [] as { slug: string; updatedAt: Date }[],
    materials: [] as { slug: string; updatedAt: Date }[],
  }));

  return [
    ...staticRoutes,
    ...data.characters.map((item) => ({
      url: absoluteUrl(`/wiki/characters/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...data.weapons.map((item) => ({
      url: absoluteUrl(`/wiki/weapons/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...data.artifacts.map((item) => ({
      url: absoluteUrl(`/wiki/artifacts/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...data.materials.map((item) => ({
      url: absoluteUrl(`/wiki/materials/${item.slug}`),
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
