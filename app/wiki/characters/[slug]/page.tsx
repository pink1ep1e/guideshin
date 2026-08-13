import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CharacterHeroBanner from "@/components/CharacterHeroBanner";
import CharacterGuideView from "@/components/CharacterGuideView";
import { parseMaterials } from "@/lib/character-materials";
import { parseTalents } from "@/lib/character-talents";
import { parseConstellations } from "@/lib/character-constellations";
import { getCharacterBySlug } from "@/lib/character-data";
import { ELEMENT_LABEL } from "@/lib/genshin";
import { materialPreviewLore } from "@/lib/wiki-guide-data";
import { parseGuideBlocks } from "@/lib/guide-builder";
import { withPrisma } from "@/prisma/prisma-client";
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
  const character = await getCharacterBySlug(slug);

  if (!character) return { title: "Персонаж не найден" };

  const element = ELEMENT_LABEL[character.element] ?? character.element;
  const title = `Гайд на ${character.name}: билды, таланты`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description =
    character.shortDesc?.trim() ||
    `Гайд на ${character.name} в Genshin Impact: лучший билд, оружие, артефакты, таланты и материалы прокачки. ${element}-персонаж — ${SITE_NAME}.`;
  const url = absoluteUrl(`/wiki/characters/${character.slug}`);
  const image = character.splashImage || character.image;

  return {
    title: { absolute: fullTitle },
    description,
    keywords: [
      `гайд ${character.name}`,
      `гайд на ${character.name}`,
      `билд ${character.name}`,
      character.name,
      `${character.name} Genshin`,
      `${character.name} артефакты`,
      `${character.name} оружие`,
      "Genshin Impact",
      SITE_NAME,
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: image ? [{ url: image, alt: character.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export const revalidate = 60;

export default async function CharacterPage({ params }: Props) {
  const { slug } = await params;
  const character = await getCharacterBySlug(slug);

  if (!character || !character.published) notFound();

  const materials = parseMaterials(character.levelMaterials);
  const talents = parseTalents(character.talents);
  const constellations = parseConstellations(character.constellations);
  const element = ELEMENT_LABEL[character.element] ?? character.element;
  const pageUrl = absoluteUrl(`/wiki/characters/${character.slug}`);
  const image = character.splashImage || character.image;
  const description =
    character.shortDesc?.trim() ||
    `Гайд на ${character.name} в Genshin Impact: билд, оружие, артефакты и материалы.`;

  const materialNames = [
    ...new Set(materials.map((m) => m.name.trim()).filter(Boolean)),
  ];
  const loreRows =
    materialNames.length > 0
      ? await withPrisma((prisma) =>
          prisma.material.findMany({
            where: { name: { in: materialNames } },
            select: { name: true, shortDesc: true, guideData: true },
          }),
        ).catch(() => [])
      : [];

  const loreByName: Record<string, string> = {};
  for (const row of loreRows) {
    const text = materialPreviewLore(row);
    if (text) loreByName[row.name.trim().toLowerCase()] = text;
  }

  const guideBlocks = parseGuideBlocks(character.contentHtml);
  const guideHtml = character.contentHtml.replace(
    /<!--genshin-guide-blocks:[\s\S]*?-->/,
    "",
  );

  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Персонажи", path: "/wiki/characters" },
    {
      name: character.name,
      path: `/wiki/characters/${character.slug}`,
    },
  ];

  const jsonLd = [
    articleJsonLd({
      headline: `Гайд на ${character.name}`,
      description,
      url: pageUrl,
      image,
      datePublished: character.createdAt,
      dateModified: character.updatedAt,
      aboutName: character.name,
      aboutDescription: `${element}-персонаж Genshin Impact`,
    }),
    breadcrumbJsonLd(breadcrumbs),
  ];

  return (
    <div className="container-page py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="mb-6">
        <CharacterHeroBanner
          name={character.name}
          image={character.image}
          splashImage={character.splashImage}
          rarity={character.rarity}
          element={character.element}
          weaponType={character.weaponType}
          region={character.region}
          shortDesc={character.shortDesc}
          sticker={character.sticker}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_272px] lg:gap-7">
        <div className="min-w-0">
          {guideBlocks && guideBlocks.length > 0 ? (
            <CharacterGuideView
              characterName={character.name}
              element={character.element}
              blocks={guideBlocks}
              materials={materials}
              talents={talents}
              constellations={constellations}
              loreByName={loreByName}
            />
          ) : (
            <div className="space-y-5">
              <article className="rounded-[18px] bg-white p-4 shadow-soft sm:p-6 dark:bg-[hsl(var(--card))] dark:shadow-none">
                <div
                  className="guide-html"
                  dangerouslySetInnerHTML={{ __html: guideHtml }}
                />
              </article>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Sidebar />
        </aside>
      </div>
    </div>
  );
}
