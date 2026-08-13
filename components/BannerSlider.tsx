"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { HOME_ASSETS } from "@/lib/home-content";
import { DEFAULT_BANNERS, type HomeBannerItem } from "@/lib/home-data";
import { getElementTheme } from "@/lib/genshin";
import { CharacterPortraitCard } from "@/components/GuideSections";

type Props = {
  slides?: { first: HomeBannerItem[]; second: HomeBannerItem[] };
};

export default function BannerSlider({ slides }: Props) {
  const banners: Record<"first" | "second", HomeBannerItem[]> = {
    first: slides?.first?.length
      ? slides.first
      : DEFAULT_BANNERS.filter((b) => b.half === "first"),
    second: slides?.second?.length
      ? slides.second
      : DEFAULT_BANNERS.filter((b) => b.half === "second"),
  };

  const [half, setHalf] = useState<"first" | "second">("first");
  const [index, setIndex] = useState(0);
  const [contentKey, setContentKey] = useState(0);

  const items = banners[half].length ? banners[half] : banners.first;
  const safeIndex = items.length ? Math.min(index, items.length - 1) : 0;
  const item = items[safeIndex];
  const theme = getElementTheme(item?.element || "pyro");
  const activeKey = `${half}-${safeIndex}`;

  const themeVars = {
    "--el-solid": theme.solid,
    "--el-hover": theme.hover,
    "--el-soft": theme.soft,
    "--el-soft-hover": theme.softHover,
    "--el-accent": theme.accent,
    "--el-on-solid": theme.onSolid,
    "--el-glow": theme.glow,
  } as CSSProperties;

  useEffect(() => {
    if (!items.length) return;
    const next = items[(safeIndex + 1) % items.length];
    if (!next?.image || next.image === item?.image) return;
    const img = new window.Image();
    img.src = next.image;
  }, [half, safeIndex, item?.image]);

  function switchHalf(h: "first" | "second") {
    if (h === half || !banners[h].length) return;
    setHalf(h);
    setIndex(0);
    setContentKey((k) => k + 1);
  }

  function go(delta: number) {
    if (!items.length) return;
    setIndex((p) => (p + delta + items.length) % items.length);
    setContentKey((k) => k + 1);
  }

  if (!item) {
    return (
      <section className="rounded-[20px] bg-white/90 p-10 text-center shadow-panel">
        <p className="font-medium text-muted-foreground">
          Баннер пуст. Добавьте персонажей в админке → Баннер.
        </p>
      </section>
    );
  }

  return (
    <section
      className="relative animate-reveal-up overflow-hidden rounded-[20px] bg-white/90 text-foreground shadow-panel dark:shadow-none"
      style={themeVars}
    >
      {/* Atmosphere */}
      <div className="absolute inset-0 opacity-[0.22] dark:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOME_ASSETS.heroBg}
          alt=""
          className="h-full w-full scale-105 object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/50 dark:hidden" />
      <div className="absolute inset-0 hidden bg-[hsl(var(--card))] dark:block" />
      <div
        className="el-glow-wash absolute inset-0 transition-opacity duration-700"
        style={{
          background: `
            radial-gradient(ellipse 55% 70% at 88% 45%, var(--el-glow), transparent 70%),
            radial-gradient(ellipse 40% 50% at 12% 80%, color-mix(in srgb, var(--el-solid) 18%, transparent), transparent 65%),
            linear-gradient(115deg, transparent 45%, color-mix(in srgb, var(--el-solid) 12%, transparent) 100%)
          `,
        }}
      />
      {/* Element accent edge */}
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--el-solid)] transition-colors duration-500" />

      <div className="relative grid min-h-[560px] items-center gap-6 p-6 sm:p-10 lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:p-12 lg:pl-14">
        {/* Copy column */}
        <div className="relative z-20 order-2 lg:order-1">
          <div className="mb-7 inline-flex flex-wrap gap-1 overflow-hidden rounded-[16px] bg-white/70 p-1.5 shadow-soft backdrop-blur-sm dark:bg-white/[0.06] dark:shadow-none">
            {(
              [
                ["first", "Текущие молитвы"],
                ["second", "Вторая половина"],
              ] as const
            )
              .filter(([key]) => banners[key].length > 0)
              .map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchHalf(key)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  half === key
                    ? "bg-[var(--el-solid)] text-[var(--el-on-solid)] shadow-sm"
                    : "el-label text-foreground/70 hover:bg-[var(--el-soft)] dark:hover:bg-[color-mix(in_srgb,var(--el-solid)_16%,transparent)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div key={contentKey} className="animate-reveal-up">
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <span className="el-soft-bg el-label inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.elementImg} alt="" className="h-4 w-4" />
                {item.role}
              </span>
              <span className="inline-flex items-center rounded-full bg-navy/[0.06] px-3 py-1.5 text-xs font-bold text-navy/70 dark:bg-white/[0.06] dark:text-foreground/70">
                {item.rarity}★ персонаж
              </span>
            </div>

            <div className="mb-5 flex min-h-[4.5rem] flex-wrap items-center gap-4 sm:min-h-[5rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.elementImg}
                alt=""
                className="h-[4.25rem] w-[4.25rem] drop-shadow-md sm:h-[5rem] sm:w-[5rem]"
              />
              <h1 className="font-genshin text-5xl tracking-wide text-foreground sm:text-6xl lg:text-[4.75rem] lg:leading-[0.95]">
                {item.name}
              </h1>
            </div>

            <div className="mb-8 flex flex-wrap items-stretch gap-5">
              <CharacterPortraitCard
                item={{
                  name: item.name,
                  image: item.icon,
                  element: item.element,
                  rarityStars: item.rarity,
                  href: `/wiki/characters/${item.slug}`,
                }}
              />

              <div className="flex min-w-[220px] flex-1 flex-col justify-center">
                <p className="max-w-md text-base font-medium leading-relaxed text-foreground/80 sm:text-lg dark:text-[#ece5d8]/85">
                  {item.text}
                </p>
                <div className="mt-4 h-px w-16 bg-[var(--el-solid)]/70" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/wiki/characters/${item.slug}`}
              className="group inline-flex items-center gap-2 rounded-[16px] bg-[var(--el-solid)] px-7 py-3.5 text-[15px] font-bold text-[var(--el-on-solid)] shadow-sm transition duration-300 hover:bg-[var(--el-hover)] hover:shadow-[0_8px_28px_-8px_var(--el-glow)]"
            >
              Открыть гайд
              <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/wiki/characters"
              className="el-label inline-flex items-center justify-center rounded-[16px] bg-white/80 px-6 py-3.5 text-[15px] font-bold transition duration-300 hover:bg-[var(--el-soft)] dark:bg-white/[0.06] dark:hover:bg-[color-mix(in_srgb,var(--el-solid)_16%,transparent)]"
            >
              Все персонажи
            </Link>

            <div className="ml-auto flex items-center gap-3 sm:ml-0 sm:pl-2">
              <div className="flex items-center gap-1.5">
                {items.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Слайд ${i + 1}`}
                    onClick={() => {
                      setIndex(i);
                      setContentKey((k) => k + 1);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === index
                        ? "w-7 bg-[var(--el-solid)]"
                        : "w-2 bg-navy/15 hover:bg-navy/30 dark:bg-white/15 dark:hover:bg-white/25"
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="el-label inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/80 transition hover:bg-[var(--el-soft)] dark:bg-white/[0.06] dark:hover:bg-[color-mix(in_srgb,var(--el-solid)_16%,transparent)]"
                  aria-label="Предыдущий"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="el-label inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/80 transition hover:bg-[var(--el-soft)] dark:bg-white/[0.06] dark:hover:bg-[color-mix(in_srgb,var(--el-solid)_16%,transparent)]"
                  aria-label="Следующий"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Art column */}
        <div className="pointer-events-none relative z-10 order-1 h-[380px] w-full sm:h-[460px] lg:order-2 lg:h-[560px]">
          {/* Watermark element */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.elementImg}
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-2 top-6 h-44 w-44 opacity-[0.12] transition-opacity duration-700 sm:h-56 sm:w-56 lg:right-0 lg:top-10 lg:h-72 lg:w-72 dark:opacity-[0.08]"
          />

          <div
            className="absolute bottom-4 left-[22%] h-32 w-64 -translate-x-1/2 rounded-[100%] blur-3xl transition-colors duration-700 sm:h-40 sm:w-80 dark:opacity-70"
            style={{ backgroundColor: "var(--el-glow)" }}
          />
          <div
            className="absolute bottom-16 left-[35%] h-20 w-40 -translate-x-1/2 rounded-[100%] blur-2xl opacity-50 transition-colors duration-700 dark:opacity-35"
            style={{ backgroundColor: "var(--el-solid)" }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeKey}
            src={item.image}
            alt={item.name}
            decoding="async"
            fetchPriority="high"
            className="absolute inset-y-0 -left-10 z-10 m-auto h-[90%] w-auto max-w-none translate-x-0 scale-100 object-contain object-left opacity-100 drop-shadow-2xl transition-all duration-500 sm:-left-16 lg:-left-28"
          />
        </div>
      </div>
    </section>
  );
}
