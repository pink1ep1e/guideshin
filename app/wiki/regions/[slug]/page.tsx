import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import {
  getRegionMeta,
  PUBLIC_REGION_SLUGS,
  REGION_SLUGS,
  slugToRegion,
  normalizeRegion,
  type RegionSlug,
} from "@/lib/regions";
import {
  breadcrumbJsonLd,
  collectionPageJsonLd,
  DEFAULT_OG_IMAGE,
  itemListJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { withPrisma } from "@/prisma/prisma-client";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PUBLIC_REGION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = slugToRegion(slug);
  if (!meta || meta.slug === "other") {
    return { title: "Регион не найден" };
  }

  const title = `${meta.name}: персонажи, гайды и материалы`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const description = `${meta.shortDesc} Актуальные билды Genshin Impact на ${SITE_NAME}.`;
  const url = absoluteUrl(`/wiki/regions/${meta.slug}`);
  const image = meta.image || DEFAULT_OG_IMAGE;

  return {
    title: { absolute: fullTitle },
    description,
    keywords: [...meta.keywords, "Genshin Impact", SITE_NAME],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [{ url: image, alt: meta.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}

export const revalidate = 60;

type WikiCard = {
  slug: string;
  name: string;
  image: string;
  shortDesc: string | null;
};

export default async function RegionPage({ params }: Props) {
  const { slug } = await params;
  const meta = slugToRegion(slug);
  if (!meta || !(REGION_SLUGS as readonly string[]).includes(slug)) {
    notFound();
  }
  if (meta.slug === "other") notFound();

  const regionSlug = meta.slug as RegionSlug;
  const data = await withPrisma(async (prisma) => {
    const [characters, artifacts, materials] = await Promise.all([
      prisma.character.findMany({
        where: { published: true },
        orderBy: [{ rarity: "desc" }, { name: "asc" }],
        select: {
          slug: true,
          name: true,
          image: true,
          shortDesc: true,
          region: true,
        },
      }),
      prisma.artifact.findMany({
        where: { published: true },
        orderBy: [{ rarity: "desc" }, { name: "asc" }],
        select: {
          slug: true,
          name: true,
          image: true,
          shortDesc: true,
          region: true,
        },
      }),
      prisma.material.findMany({
        where: { published: true },
        orderBy: [{ rarityStars: "desc" }, { name: "asc" }],
        select: {
          slug: true,
          name: true,
          image: true,
          shortDesc: true,
          region: true,
        },
      }),
    ]);
    return { characters, artifacts, materials };
  }).catch(() => ({
    characters: [] as (WikiCard & { region: string | null })[],
    artifacts: [] as (WikiCard & { region: string | null })[],
    materials: [] as (WikiCard & { region: string | null })[],
  }));

  const characters = data.characters.filter(
    (c) => normalizeRegion(c.region) === regionSlug,
  );
  const artifacts = data.artifacts.filter(
    (a) => normalizeRegion(a.region) === regionSlug,
  );
  const materials = data.materials.filter(
    (m) => normalizeRegion(m.region) === regionSlug,
  );

  const pageUrl = absoluteUrl(`/wiki/regions/${meta.slug}`);
  const title = `${meta.name}: персонажи, гайды и материалы`;
  const description = `${meta.shortDesc} Актуальные билды Genshin Impact на ${SITE_NAME}.`;
  const ogImage = meta.image || DEFAULT_OG_IMAGE;

  const listItems = [
    ...characters.map((c) => ({
      name: c.name,
      url: absoluteUrl(`/wiki/characters/${c.slug}`),
    })),
    ...artifacts.map((a) => ({
      name: a.name,
      url: absoluteUrl(`/wiki/artifacts/${a.slug}`),
    })),
    ...materials.map((m) => ({
      name: m.name,
      url: absoluteUrl(`/wiki/materials/${m.slug}`),
    })),
  ];

  const jsonLd = [
    collectionPageJsonLd({
      name: title,
      description,
      url: pageUrl,
      aboutName: meta.name,
    }),
    breadcrumbJsonLd([
      { name: "Главная", path: "/" },
      { name: "Регионы", path: "/wiki/regions" },
      { name: meta.name, path: `/wiki/regions/${meta.slug}` },
    ]),
    itemListJsonLd({
      name: `Контент региона ${meta.name}`,
      description,
      items: listItems,
    }),
  ];

  const siblingRegions = PUBLIC_REGION_SLUGS.filter((s) => s !== regionSlug)
    .slice(0, 4)
    .map((s) => getRegionMeta(s));

  return (
    <div className="pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-[0.22]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ogImage}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/70" />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

          <div className="relative max-w-2xl">
            <nav className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-[#189b8e]">
              <Link href="/wiki/regions" className="hover:underline">
                Регионы
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground/70">{meta.name}</span>
            </nav>
            <h1 className="font-genshin text-4xl tracking-wide text-foreground sm:text-5xl">
              {meta.name}
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              {meta.intro}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/wiki/characters" className="ui-btn-secondary">
                Все персонажи
              </Link>
              <Link href="/wiki/artifacts" className="ui-btn-secondary">
                Артефакты
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8">
            <EntitySection
              title={`Персонажи ${meta.genitive}`}
              empty="Пока нет опубликованных персонажей этого региона."
              items={characters}
              hrefPrefix="/wiki/characters"
            />
            <EntitySection
              title={`Артефакты ${meta.genitive}`}
              empty="Пока нет опубликованных артефактов этого региона."
              items={artifacts}
              hrefPrefix="/wiki/artifacts"
            />
            <EntitySection
              title={`Материалы ${meta.genitive}`}
              empty="Пока нет опубликованных материалов этого региона."
              items={materials}
              hrefPrefix="/wiki/materials"
            />

            <div className="glass-panel p-5 sm:p-6">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
                Другие регионы
              </p>
              <div className="flex flex-wrap gap-2">
                {siblingRegions.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/wiki/regions/${r.slug}`}
                    className="rounded-full bg-[#189b8e]/10 px-3.5 py-1.5 text-sm font-bold text-[#189b8e] transition hover:bg-[#189b8e] hover:text-white"
                  >
                    {r.name}
                  </Link>
                ))}
                <Link
                  href="/wiki/regions"
                  className="rounded-full bg-navy/[0.06] px-3.5 py-1.5 text-sm font-bold text-navy/70 transition hover:bg-navy/10"
                >
                  Все регионы
                </Link>
              </div>
            </div>
          </div>
          <Sidebar />
        </div>
      </section>
    </div>
  );
}

function EntitySection({
  title,
  empty,
  items,
  hrefPrefix,
}: {
  title: string;
  empty: string;
  items: WikiCard[];
  hrefPrefix: string;
}) {
  return (
    <div>
      <h2 className="section-title mb-4">{title}</h2>
      {items.length === 0 ? (
        <div className="glass-panel p-6">
          <p className="text-base font-medium text-muted-foreground">{empty}</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={`${hrefPrefix}/${item.slug}`}
                className="glass-panel flex items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:ring-1 hover:ring-[#189b8e]/25"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-genshin text-base tracking-wide text-foreground">
                    {item.name}
                  </p>
                  {item.shortDesc && (
                    <p className="mt-0.5 line-clamp-2 text-xs font-medium text-muted-foreground">
                      {item.shortDesc}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
