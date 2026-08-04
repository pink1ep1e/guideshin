"use client";

import { useState, type CSSProperties } from "react";
import {
  renderConstellationDescription,
  type CharacterConstellation,
} from "@/lib/character-constellations";
import { getElementTheme } from "@/lib/genshin";

const DARK_ICON_FILTER =
  "brightness(0) saturate(100%) invert(18%) sepia(18%) saturate(900%) hue-rotate(185deg)";

type Props = {
  constellations: CharacterConstellation[];
  element?: string;
};

export default function CharacterConstellations({
  constellations,
  element = "HYDRO",
}: Props) {
  const [active, setActive] = useState(0);
  if (!constellations.length) return null;

  const theme = getElementTheme(element);
  const c = constellations[Math.min(active, constellations.length - 1)];

  return (
    <section className="guide-panel">
      <span className="guide-panel-ornament" aria-hidden />
      <header className="guide-section-head">
        <p className="guide-eyebrow">
          <span className="guide-eyebrow-mark" aria-hidden />
          Геймплей
        </p>
        <h2 className="guide-title">Созвездие</h2>
      </header>
      <div className="guide-module-line" aria-hidden />

      <div className="relative z-[1] mt-5 flex flex-wrap gap-3 sm:gap-4">
        {constellations.map((item, i) => {
          const on = i === active;
          const elStyle = {
            "--talent-el": theme.solid,
            "--talent-glow": theme.glow,
          } as CSSProperties;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(i)}
              className={`talent-key group relative flex h-[80px] w-[80px] items-center justify-center rounded-full transition sm:h-[92px] sm:w-[92px] ${
                on ? "talent-key--active" : "talent-key--idle"
              }`}
              style={elStyle}
              aria-pressed={on}
              title={`C${item.level}: ${item.name}`}
            >
              {on ? (
                <span
                  className="talent-key-ring pointer-events-none absolute inset-[-8px]"
                  style={{ color: theme.solid }}
                  aria-hidden
                />
              ) : (
                <span className="talent-key-idle-ring" aria-hidden />
              )}
              <span className="relative z-[1] flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full bg-[#f0f3f6] ring-1 ring-black/[0.06] sm:h-[66px] sm:w-[66px]">
                {item.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.icon}
                    alt=""
                    className={`h-[42px] w-[42px] object-contain transition sm:h-[48px] sm:w-[48px] ${
                      on ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                    }`}
                    style={{ filter: DARK_ICON_FILTER }}
                  />
                ) : (
                  <span
                    className={`text-[15px] font-semibold tabular-nums transition ${
                      on ? "text-[#1a2744]" : "text-[#1a2744]/70"
                    }`}
                  >
                    C{item.level}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative z-[1] mt-6 border-t border-black/[0.06] pt-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-semibold uppercase tracking-wide text-[#189b8e]">
              C{c.level}
            </span>
            <h3 className="text-[1.3rem] font-semibold tracking-tight text-foreground sm:text-[1.45rem]">
              {c.name}
            </h3>
          </div>
          {c.description ? (
            <div
              className="constellation-desc mt-3 max-w-3xl space-y-3 text-[15px] leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: `<p>${renderConstellationDescription(c.description)}</p>`,
              }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
