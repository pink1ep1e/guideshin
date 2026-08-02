import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import MaterialGuideView from "@/components/MaterialGuideView";
import { withPrisma } from "@/prisma/prisma-client";
import { MATERIAL_CATEGORY_LABEL } from "@/lib/character-materials";
import { parseMaterialGuide, plainLore } from "@/lib/wiki-guide-data";
import { SITE_NAME } from "@/lib/site";
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
  const url = `/wiki/materials/${item.slug}`;

  return {
    title: { absolute: fullTitle },
    description,
    keywords: [item.name, `где взять ${item.name}`, "материалы Genshin", "Genshin Impact", SITE_NAME],
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

export default async function MaterialDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await withPrisma((prisma) =>
    prisma.material.findUnique({ where: { slug } }),
  ).catch(() => null);
  if (!item || !item.published) notFound();
  const guide = parseMaterialGuide(item.guideData);

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

  const loreRows =
    relatedNames.length > 0
      ? await withPrisma((prisma) =>
          prisma.material.findMany({
            where: { name: { in: [...new Set(relatedNames)] } },
            select: { name: true, shortDesc: true, guideData: true },
          }),
        ).catch(() => [])
      : [];

  const loreByName: Record<string, string> = {};
  for (const row of loreRows) {
    const g = parseMaterialGuide(row.guideData);
    const text =
      g.lore?.trim() ||
      row.shortDesc?.trim() ||
      plainLore(g.description);
    if (text) loreByName[row.name.trim().toLowerCase()] = text;
  }

  return (
    <div className="container-page py-7 sm:py-9">
      <div className="mb-5">
        <Link href="/wiki/materials" className="text-sm font-bold text-[#189b8e] hover:underline">
          ← Все материалы
        </Link>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="rounded-[20px] border border-black/[0.06] bg-white/90 px-5 py-4 shadow-soft sm:px-6">
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
