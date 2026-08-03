import { notFound } from "next/navigation";
import CharacterHeroBanner from "@/components/CharacterHeroBanner";
import GuideCalculators from "@/components/GuideCalculators";
import GuideSectionNav from "@/components/GuideSectionNav";
import MaterialCards from "@/components/MaterialCards";
import { parseMaterials } from "@/lib/character-materials";
import { getCharacterBySlug } from "@/lib/character-data";
import {
  buildGuideNavItems,
  parseGuideBlocks,
  type GuideNavItem,
} from "@/lib/guide-builder";
import { ELEMENT_LABEL } from "@/lib/genshin";
import { materialPreviewLore } from "@/lib/wiki-guide-data";
import { withPrisma } from "@/prisma/prisma-client";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
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

  const blocks = parseGuideBlocks(character.contentHtml) ?? [];
  const navItems: GuideNavItem[] = [
    { id: "guide-calc", label: "Калькулятор" },
    ...(materials.length
      ? [{ id: "guide-materials", label: "Материалы" } satisfies GuideNavItem]
      : []),
    ...buildGuideNavItems(blocks),
  ];

  const guideHtml = character.contentHtml.replace(
    /<!--genshin-guide-blocks:[\s\S]*?-->/,
    "",
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Гайд на ${character.name}`,
    description,
    image: image ? [image.startsWith("http") ? image : absoluteUrl(image)] : undefined,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.svg") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    dateModified: character.updatedAt.toISOString(),
    datePublished: character.createdAt.toISOString(),
    about: {
      "@type": "Thing",
      name: character.name,
      description: `${element}-персонаж Genshin Impact`,
    },
  };

  return (
    <div className="container-page-wide py-7 sm:py-9">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-5">
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

      <GuideSectionNav items={navItems} />

      <div className="space-y-6">
        <GuideCalculators characterName={character.name} />
        <MaterialCards materials={materials} loreByName={loreByName} />

        <section className="overflow-hidden rounded-[22px] border border-black/[0.05] bg-white/90 p-5 shadow-panel sm:p-8 lg:p-10">
          <div
            className="guide-html"
            dangerouslySetInnerHTML={{ __html: guideHtml }}
          />
        </section>
      </div>
    </div>
  );
}
