import Link from "next/link";
import type { Metadata } from "next";
import BannerSlider from "@/components/BannerSlider";
import { HOME_ASSETS, PRODUCTS } from "@/lib/home-content";
import { loadHomeBanners } from "@/lib/home-data";
import {
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  absoluteUrl,
} from "@/lib/site";
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: SITE_TITLE_DEFAULT },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const banners = await loadHomeBanners();

  return (
    <div className="pb-4">
      {/* Hero full-bleed vibe */}
      <div className="container-page pt-7 sm:pt-9">
        <h1 className="sr-only">
          Guideshin — гайды на персонажей Genshin Impact: билды, оружие и артефакты
        </h1>
        <BannerSlider slides={banners} />
      </div>

      {/* Products */}
      <section className="container-page mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
              Разделы
            </p>
            <h2 className="section-title">Всё для прохождения</h2>
          </div>
          <Link
            href="/wiki/characters"
            className="ui-btn-secondary hidden sm:inline-flex"
          >
            Смотреть всё
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PRODUCTS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="glass-panel group relative min-h-[200px] overflow-hidden p-6 transition hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute -right-4 bottom-0 h-[85%] w-[55%] opacity-35 transition duration-500 group-hover:opacity-55 group-hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.art}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain object-bottom drop-shadow-xl"
                />
              </div>
              <span className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-[#189b8e]/12 blur-xl" />
              <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#189b8e] to-[#67d5cc]" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <h3 className="font-genshin mb-2 text-[22px] tracking-wide text-foreground">
                    {item.title}
                  </h3>
                  <p className="max-w-[12rem] text-sm font-medium text-muted-foreground">
                    {item.text}
                  </p>
                </div>
                <span className="mt-6 inline-flex w-fit rounded-full bg-[#189b8e]/12 px-3 py-1.5 text-xs font-bold text-[#189b8e]">
                  Открыть →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Wide art band */}
      <section className="container-page mt-12">
        <div className="glass-panel relative overflow-hidden text-foreground">
          <div className="absolute inset-0 dark:opacity-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HOME_ASSETS.featureWide}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover opacity-45 dark:opacity-30"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/55 dark:from-[hsl(var(--card))] dark:via-[hsl(var(--card)/0.94)] dark:to-[hsl(var(--card)/0.65)]" />
          <div className="relative grid gap-6 p-8 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:p-12">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
                Сезон гайдов
              </p>
              <h2 className="font-genshin text-3xl tracking-wide text-foreground sm:text-4xl">
                Собери команду мечты
              </h2>
              <p className="mt-3 max-w-lg text-base font-medium text-foreground/80">
                Готовые билды, ротации и приоритет прокачки — без воды.
              </p>
              <Link href="/wiki/characters" className="ui-btn-primary mt-6">
                К персонажам
              </Link>
            </div>
            <div className="relative flex min-h-[200px] items-end justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOME_ASSETS.duoChibi}
                alt=""
                loading="lazy"
                decoding="async"
                className="max-h-[240px] w-auto scale-125 object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="container-page mt-12 mb-6">
        <div className="glass-panel relative overflow-hidden p-8 text-foreground sm:p-12">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-[#189b8e]/15" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-[#189b8e]/12" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HOME_ASSETS.chars.dahlia}
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute -bottom-6 right-4 hidden h-[92%] max-w-[38%] object-contain opacity-85 drop-shadow-2xl lg:block"
          />
          <div className="relative max-w-xl lg:max-w-2xl">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.1em] text-[#189b8e]">
              Guideshin
            </p>
            <h2 className="font-genshin text-3xl tracking-wide text-foreground sm:text-4xl">
              Все гайды — всегда под рукой
            </h2>
            <p className="mt-3 text-base font-medium text-muted-foreground sm:text-lg">
              Персонажи, артефакты и тир-листы в одном месте.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/wiki/characters" className="ui-btn-primary">
                Открыть персонажей
              </Link>
              <Link href="/wiki/artifacts" className="ui-btn-secondary">
                Артефакты
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
