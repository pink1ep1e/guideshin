import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MaterialGuideView from "@/components/MaterialGuideView";
import { withPrisma } from "@/prisma/prisma-client";
import { MATERIAL_CATEGORY_LABEL } from "@/lib/character-materials";
import {
  parseMaterialGuide,
  parseWeaponGuide,
  materialPreviewLore,
  weaponHoverFromGuide,
  type WeaponHoverMeta,
} from "@/lib/wiki-guide-data";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await withPrisma((prisma) =>
    prisma.material.findUnique({ where: { slug } }),
  ).catch(() => null);
  if (!item) return { title: "Материал не найден" };

  const title = item.name;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description =
    item.shortDesc?.trim() ||
    `Где взять ${item.name} в Genshin Impact: источники, карта и применение.`;
  const url = absoluteUrl(`/wiki/materials/${item.slug}`);

  return {
    title: { absolute: fullTitle },
    description,
    keywords: [item.name, `где взять ${item.name}`, "материалы Genshin", "Genshin Impact", SITE_NAME],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: item.image ? [{ url: item.image, alt: item.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: item.image ? [item.image] : undefined,
    },
  };
}

export const revalidate = 60;

export default async function MaterialDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await withPrisma((prisma) =>
    prisma.material.findUnique({ where: { slug } }),
  ).catch(() => null);
  if (!item || !item.published) notFound();
  const guide = parseMaterialGuide(item.guideData);
  const pageUrl = absoluteUrl(`/wiki/materials/${item.slug}`);
  const description =
    item.shortDesc?.trim() ||
    `Где взять ${item.name} в Genshin Impact: источники и применение.`;

  const relatedNames = [
    ...guide.alchemyUses,
    ...guide.alchemyCraft,
    ...guide.forgingUses,
    ...guide.forgingIngredients,
    ...guide.teapotItems,
    ...guide.weapons,
  ]
    .map((m) => m.name.trim())
    .filter(Boolean);

  const uniqueNames = [...new Set(relatedNames)];

  const [loreRows, weaponRows] =
    uniqueNames.length > 0
      ? await withPrisma(async (prisma) =>
          Promise.all([
            prisma.material.findMany({
              where: { name: { in: uniqueNames } },
              select: { name: true, shortDesc: true, guideData: true },
            }),
            prisma.weapon.findMany({
              where: { name: { in: uniqueNames } },
              select: { name: true, weaponType: true, guideData: true },
            }),
          ]),
        ).catch(() => [[], []] as const)
      : [[], []];

  const loreByName: Record<string, string> = {};
  for (const row of loreRows) {
    const text = materialPreviewLore(row);
    if (text) loreByName[row.name.trim().toLowerCase()] = text;
  }

  const weaponMetaByName: Record<string, WeaponHoverMeta> = {};
  for (const row of weaponRows) {
    const meta = weaponHoverFromGuide(row.weaponType, parseWeaponGuide(row.guideData));
    if (meta.weaponType || meta.atk || meta.subStat) {
      weaponMetaByName[row.name.trim().toLowerCase()] = meta;
    }
  }

  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Материалы", path: "/wiki/materials" },
    {
      name: item.name,
      path: `/wiki/materials/${item.slug}`,
    },
  ];

  const jsonLd = [
    articleJsonLd({
      headline: item.name,
      description,
      url: pageUrl,
      image: item.image,
      datePublished: item.createdAt,
      dateModified: item.updatedAt,
      aboutName: item.name,
      aboutDescription: "Материал Genshin Impact",
    }),
    breadcrumbJsonLd(breadcrumbs),
  ];

  return (
    <div className="container-page py-7 sm:py-9">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="mb-5">
        <Link href="/wiki/materials" className="text-sm font-bold text-[#189b8e] hover:underline">
          ← Все материалы
        </Link>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="rounded-[20px] bg-white/90 px-5 py-4 shadow-soft sm:px-6 dark:bg-[hsl(var(--card))] dark:shadow-none">
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
              {MATERIAL_CATEGORY_LABEL[item.category as keyof typeof MATERIAL_CATEGORY_LABEL] ??
                item.category}{" "}
              · {item.rarityStars}★
            </p>
            <h1 className="font-genshin mt-1 text-3xl tracking-wide text-foreground">{item.name}</h1>
            {item.shortDesc && (
              <p className="mt-1 text-sm font-medium text-muted-foreground">{item.shortDesc}</p>
            )}
          </div>

          <MaterialGuideView
            materialName={item.name}
            rarityStars={item.rarityStars}
            image={item.image}
            data={guide}
            loreByName={loreByName}
            weaponMetaByName={weaponMetaByName}
          />

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
