import type { CSSProperties } from "react";
import {
  ELEMENT_LABEL,
  ELEMENT_SVG,
  RARITY_LABEL,
  RARITY_STARS,
  getElementTheme,
  resolveCharacterSplash,
} from "@/lib/genshin";
import { HOME_ASSETS } from "@/lib/home-content";
import CharacterSplashArt from "@/components/CharacterSplashArt";
import StickerBadge from "@/components/StickerBadge";
import { CharacterPortraitCard } from "@/components/GuideSections";
import { getRegionMeta } from "@/lib/regions";

type CharacterHeroBannerProps = {
  name: string;
  image: string;
  splashImage?: string | null;
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON";
  element: string;
  weaponType?: string | null;
  region?: string | null;
  shortDesc?: string | null;
  sticker?: string | null;
};

export default function CharacterHeroBanner({
  name,
  image,
  splashImage,
  rarity,
  element,
  weaponType,
  region,
  shortDesc,
  sticker,
}: CharacterHeroBannerProps) {
  const theme = getElementTheme(element);
  const elementImg = ELEMENT_SVG[element.toUpperCase()];
  const stars = RARITY_STARS[rarity] ?? 4;
  const art = resolveCharacterSplash(image, splashImage);

  const themeVars = {
    "--el-solid": theme.solid,
    "--el-hover": theme.hover,
    "--el-soft": theme.soft,
    "--el-soft-hover": theme.softHover,
    "--el-accent": theme.accent,
    "--el-on-solid": theme.onSolid,
    "--el-glow": theme.glow,
  } as CSSProperties;

  const roleParts = [
    weaponType || null,
    ELEMENT_LABEL[element.toUpperCase()] || null,
  ].filter(Boolean);
  const regionMeta = region ? getRegionMeta(region) : null;
  const regionLabel =
    regionMeta && regionMeta.slug !== "other" ? regionMeta.name : region;

  return (
    <section
      className="relative animate-reveal-up overflow-hidden rounded-[20px] bg-white/90 text-foreground shadow-panel ring-1 ring-black/[0.04]"
      style={themeVars}
    >
      <div className="absolute inset-0 opacity-[0.22]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HOME_ASSETS.heroBg}
          alt=""
          className="h-full w-full scale-105 object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white/95 to-white/50" />
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `
            radial-gradient(ellipse 55% 70% at 88% 45%, var(--el-glow), transparent 70%),
            radial-gradient(ellipse 40% 50% at 12% 80%, var(--el-soft), transparent 65%),
            linear-gradient(115deg, transparent 40%, var(--el-soft) 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--el-soft) 1px, transparent 1px), linear-gradient(90deg, var(--el-soft) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 80% at 70% 50%, black 10%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 80% at 70% 50%, black 10%, transparent 75%)",
        }}
      />
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--el-solid)]" />

      <div className="relative grid min-h-[420px] items-center gap-6 p-6 sm:min-h-[480px] sm:p-10 lg:min-h-[520px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:p-12 lg:pl-14">
        <div className="relative z-20 order-2 lg:order-1">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--el-soft)] px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[var(--el-accent)]">
              {elementImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={elementImg} alt="" className="h-4 w-4" />
              )}
              {roleParts.length > 0 ? roleParts.join(" · ") : "Персонаж"}
            </span>
            <span className="inline-flex items-center rounded-full bg-navy/[0.06] px-3 py-1.5 text-xs font-bold text-navy/70">
              {RARITY_LABEL[rarity]} персонаж
            </span>
            {sticker && <StickerBadge label={sticker} size="md" variant="pill" />}
          </div>

          <div className="mb-5 flex min-h-[4.5rem] flex-wrap items-center gap-4 sm:min-h-[5rem]">
            {elementImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={elementImg}
                alt=""
                className="h-[4.25rem] w-[4.25rem] drop-shadow-md sm:h-[5rem] sm:w-[5rem]"
              />
            )}
            <h1 className="font-genshin text-5xl tracking-wide text-navy sm:text-6xl lg:text-[4.75rem] lg:leading-[0.95]">
              {name}
            </h1>
          </div>

          <div className="mb-6 flex flex-wrap items-stretch gap-5">
            <CharacterPortraitCard
              item={{
                name,
                image,
                element,
                rarityStars: stars,
              }}
            />

            <div className="flex min-w-[220px] flex-1 flex-col justify-center">
              {shortDesc ? (
                <p className="max-w-md text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                  {shortDesc}
                </p>
              ) : (
                <p className="max-w-md text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">
                  Гайд, билды и материалы для прокачки {name}.
                </p>
              )}
              <div className="mt-4 h-px w-16 bg-[var(--el-solid)]/70" />
              <div className="mt-4 flex flex-wrap gap-2">
                {weaponType && (
                  <span className="rounded-full bg-[var(--el-soft)] px-3 py-1.5 text-xs font-bold text-[var(--el-accent)]">
                    {weaponType}
                  </span>
                )}
                {regionLabel && (
                  <span className="rounded-full bg-[var(--el-soft)] px-3 py-1.5 text-xs font-bold text-[var(--el-accent)]">
                    {regionLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative z-10 order-1 h-[320px] w-full overflow-hidden sm:h-[400px] lg:order-2 lg:h-[460px] lg:overflow-visible">
          {elementImg && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={elementImg}
              alt=""
              aria-hidden
              className="pointer-events-none absolute right-2 top-6 h-44 w-44 opacity-[0.12] sm:h-56 sm:w-56 lg:right-0 lg:top-10 lg:h-72 lg:w-72"
            />
          )}
          <div
            className="absolute bottom-4 left-[22%] h-32 w-64 -translate-x-1/2 rounded-[100%] blur-3xl sm:h-40 sm:w-80"
            style={{ backgroundColor: "var(--el-glow)" }}
          />
          <div
            className="absolute bottom-16 left-[35%] h-20 w-40 -translate-x-1/2 rounded-[100%] blur-2xl opacity-60"
            style={{ backgroundColor: "var(--el-solid)" }}
          />
          <CharacterSplashArt
            src={art}
            fallbackSrc={image}
            alt={name}
            className="absolute inset-y-0 -left-10 m-auto h-[90%] w-auto max-w-none object-contain object-left drop-shadow-2xl sm:-left-16 lg:-left-28"
          />
        </div>
      </div>
    </section>
  );
}
