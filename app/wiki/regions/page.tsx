import Link from "next/link";
import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import {
  PUBLIC_REGION_SLUGS,
  REGIONS_META,
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
import { HOME_ASSETS } from "@/lib/home-content";

const title = `Регионы Тейвата: гайды по персонажам`;
const description =
  "Гайды Genshin Impact по регионам: Нод-Край, Снежная, Натлан, Фонтейн и другие. Персонажи, артефакты и материалы.";
const pageUrl = absoluteUrl("/wiki/regions");

export const metadata: Metadata = {
  title: { absolute: `${title} | ${SITE_NAME}` },
  description,
  keywords: [
    "регионы Genshin",
    "Нод-Край",
    "Снежная",
    "гайды по регионам",
    "Тейват",
    SITE_NAME,
  ],
  alternates: { canonical: "/wiki/regions" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: pageUrl,
    siteName: SITE_NAME,
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [{ url: DEFAULT_OG_IMAGE, alt: title }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SITE_NAME}`,
    description,
    images: [DEFAULT_OG_IMAGE],
  },
};

export const revalidate = 60;

export default function RegionsHubPage() {
  const regions = PUBLIC_REGION_SLUGS.map((slug) => REGIONS_META[slug]);

  const jsonLd = [
    collectionPageJsonLd({
      name: title,
      description,
      url: pageUrl,
      aboutName: "Тейват",
    }),
    breadcrumbJsonLd([
      { name: "Главная", path: "/" },
      { name: "Регионы", path: "/wiki/regions" },
    ]),
    itemListJsonLd({
      name: "Регионы Тейвата",
      description,
      items: regions.map((r) => ({
        name: r.name,
        url: absoluteUrl(`/wiki/regions/${r.slug}`),
      })),
    }),
  ];

  return (
    <div className="pb-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <section className="container-page pt-7 sm:pt-9">
        <div className="glass-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-[0.18]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOME_ASSETS.heroBg}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/70" />
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />

          <div className="relative max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
              Тейват
            </p>
            <h1 className="font-genshin text-4xl tracking-wide text-foreground sm:text-5xl">
              Регионы
            </h1>
            <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
              Выберите регион: персонажи, артефакты и материалы с гайдами. В приоритете
              Нод-Край и подготовка к Снежной.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/wiki/regions/nod-krai" className="ui-btn-primary">
                Нод-Край
              </Link>
              <Link href="/wiki/regions/snezhnaya" className="ui-btn-secondary">
                Снежная
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page mt-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-4 sm:grid-cols-2">
            {regions.map((region) => (
              <RegionCard key={region.slug} slug={region.slug} />
            ))}
          </div>
          <Sidebar />
        </div>
      </section>
    </div>
  );
}

function RegionCard({ slug }: { slug: RegionSlug }) {
  const region = REGIONS_META[slug];
  const image = region.image || HOME_ASSETS.heroBg;

  return (
    <Link
      href={`/wiki/regions/${region.slug}`}
      className="group relative min-h-[200px] overflow-hidden rounded-[20px] bg-white/80 text-foreground shadow-panel transition hover:-translate-y-1"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={region.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h2 className="font-genshin text-xl tracking-wide">{region.name}</h2>
        <p className="mt-1 text-sm font-medium text-foreground/75">
          {region.shortDesc}
        </p>
      </div>
    </Link>
  );
}
