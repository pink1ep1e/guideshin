import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import CharacterHeroBanner from "@/components/CharacterHeroBanner";
import GuideCalculators from "@/components/GuideCalculators";
import MaterialCards from "@/components/MaterialCards";
import { parseMaterials } from "@/lib/character-materials";
import { getCharacterBySlug } from "@/lib/character-data";
import { ELEMENT_LABEL } from "@/lib/genshin";
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
    <div className="container-page py-7 sm:py-9">
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

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <GuideCalculators characterName={character.name} />
          <MaterialCards materials={materials} />

          <section className="panel p-6 sm:p-7">
            <div
              className="guide-html"
              dangerouslySetInnerHTML={{
                __html: character.contentHtml.replace(
                  /<!--genshin-guide-blocks:[\s\S]*?-->/,
                  "",
                ),
              }}
            />
          </section>
        </div>

        <Sidebar />
      </div>
    </div>
  );
}
