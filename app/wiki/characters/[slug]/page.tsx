import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CharacterHeroBanner from "@/components/CharacterHeroBanner";
import CharacterGuideView from "@/components/CharacterGuideView";
import { parseMaterials } from "@/lib/character-materials";
import { parseTalents } from "@/lib/character-talents";
import { getCharacterBySlug } from "@/lib/character-data";
import { ELEMENT_LABEL } from "@/lib/genshin";
import { materialPreviewLore } from "@/lib/wiki-guide-data";
import { parseGuideBlocks } from "@/lib/guide-builder";
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
  const talents = parseTalents(character.talents);
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
    <div className="container-page py-6 sm:py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
              loreByName={loreByName}
            />
          ) : (
            <div className="space-y-5">
              <article className="rounded-[18px] border border-white/[0.06] bg-card p-4 shadow-soft sm:p-6">
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
