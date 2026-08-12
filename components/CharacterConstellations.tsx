"use client";

import { useState, type CSSProperties } from "react";
import {
  renderConstellationDescription,
  type CharacterConstellation,
} from "@/lib/character-constellations";
import { getElementTheme } from "@/lib/genshin";

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
          Билд
        </p>
        <h2 className="guide-title">Созвездия</h2>
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
              <span className="talent-key-idle-ring" aria-hidden />
              {on ? (
                <span
                  className="talent-key-ring pointer-events-none absolute inset-[-8px]"
                  style={{ color: theme.solid }}
                  aria-hidden
                />
              ) : null}
              <span className="relative z-[1] flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full bg-[#f0f3f6] ring-1 ring-black/[0.06] dark:bg-white/[0.08] dark:ring-white/10 sm:h-[66px] sm:w-[66px]">
                {item.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.icon}
                    alt=""
                    className={`talent-key-icon h-[42px] w-[42px] object-contain transition sm:h-[48px] sm:w-[48px] ${
                      on ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                    }`}
                  />
                ) : (
                  <span
                    className={`text-[15px] font-semibold tabular-nums transition ${
                      on
                        ? "text-[#1a2744] dark:text-white"
                        : "text-[#1a2744]/70 dark:text-white/70"
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

      <div className="relative z-[1] mt-5">
        <h3 className="font-genshin text-xl tracking-wide text-foreground sm:text-2xl">
          C{c.level}: {c.name}
        </h3>
        {c.description ? (
          <div
            className="talent-desc mt-3 text-[15px] leading-relaxed text-foreground/80"
            dangerouslySetInnerHTML={{
              __html: `<p>${renderConstellationDescription(c.description)}</p>`,
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
