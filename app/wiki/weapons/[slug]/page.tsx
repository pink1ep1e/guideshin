import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import WeaponGuideView from "@/components/WeaponGuideView";
import WeaponStatsCard from "@/components/WeaponStatsCard";
import { withPrisma } from "@/prisma/prisma-client";
import { rarityStarsFromEnum } from "@/lib/genshin";
import {
  enrichWeaponGuideMaterials,
  materialPreviewLore,
  parseWeaponGuide,
} from "@/lib/wiki-guide-data";
import { SITE_NAME } from "@/lib/site";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await withPrisma((prisma) =>
    prisma.weapon.findUnique({ where: { slug } }),
  ).catch(() => null);
  if (!item) return { title: "Оружие не найдено" };

  const title = `Гайд на ${item.name}`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description =
    item.shortDesc?.trim() ||
    `Гайд на оружие ${item.name} в Genshin Impact: характеристики, материалы возвышения и кому подойдёт.`;
  const url = `/wiki/weapons/${item.slug}`;

  return {
    title: { absolute: fullTitle },
    description,
    keywords: [`гайд ${item.name}`, item.name, "оружие Genshin", "Genshin Impact", SITE_NAME],
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      images: item.image ? [{ url: item.image, alt: item.name }] : undefined,
    },
  };
}

export const revalidate = 60;

export default async function WeaponPage({ params }: Props) {
  const { slug } = await params;
  const item = await withPrisma((prisma) =>
    prisma.weapon.findUnique({ where: { slug } }),
  ).catch(() => null);
  if (!item || !item.published) notFound();
  const stars = rarityStarsFromEnum(item.rarity);
  const rawGuide = parseWeaponGuide(item.guideData);

  const catalog = await withPrisma((prisma) =>
    prisma.material.findMany({
      where: { published: true },
      select: {
        name: true,
        slug: true,
        image: true,
        rarityStars: true,
        shortDesc: true,
        guideData: true,
      },
    }),
  ).catch(
    () =>
      [] as {
        name: string;
        slug: string;
        image: string;
        rarityStars: number;
        shortDesc: string | null;
        guideData: unknown;
      }[],
  );

  const guide = enrichWeaponGuideMaterials(rawGuide, catalog);

  const loreByName: Record<string, string> = {};
  for (const row of catalog) {
    const text = materialPreviewLore(row);
    if (text) loreByName[row.name.trim().toLowerCase()] = text;
  }

  return (
    <div className="container-page py-7 sm:py-9">
      <div className="mb-5">
        <Link href="/wiki/weapons" className="text-sm font-bold text-[#189b8e] hover:underline">
          ← Все оружие
        </Link>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <WeaponStatsCard
            name={item.name}
            image={item.image}
            weaponType={item.weaponType}
            rarityStars={stars}
            data={guide}
          />

          {item.shortDesc && !guide.passive && (
            <section className="rounded-[20px] border border-black/[0.06] bg-white/90 p-5 shadow-soft sm:p-6">
              <p className="text-base font-medium leading-relaxed text-muted-foreground">
                {item.shortDesc}
              </p>
            </section>
          )}

          <WeaponGuideView weaponName={item.name} data={guide} loreByName={loreByName} />

          {item.contentHtml && (
            <section className="panel p-6 sm:p-7">
              <div
                className="guide-html"
                dangerouslySetInnerHTML={{ __html: item.contentHtml }}
              />
            </section>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
