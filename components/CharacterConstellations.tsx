"use client";

import {
  renderConstellationDescription,
  type CharacterConstellation,
} from "@/lib/character-constellations";

type Props = {
  constellations: CharacterConstellation[];
};

export default function CharacterConstellations({ constellations }: Props) {
  if (!constellations.length) return null;

  return (
    <section className="guide-panel">
      <span className="guide-panel-ornament" aria-hidden />
      <header className="guide-section-head">
        <p className="guide-eyebrow">
          <span className="guide-eyebrow-mark" aria-hidden />
          Геймплей
        </p>
        <h2 className="guide-title">
          <span className="guide-title-glow" aria-hidden />
          Созвездие
        </h2>
      </header>
      <div className="guide-module-line" aria-hidden />

      <ol className="relative z-[1] mt-5 space-y-7">
        {constellations.map((c) => (
          <li key={c.id} className="flex gap-3.5 sm:gap-4">
            <div className="relative mt-0.5 h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#f0f3f6] ring-1 ring-black/[0.05] sm:h-12 sm:w-12">
              {c.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.icon}
                  alt=""
                  className="h-full w-full object-contain p-1.5"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[13px] font-semibold tabular-nums text-[#189b8e]">
                  C{c.level}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1 border-b border-black/[0.05] pb-7 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-[#189b8e]">
                  C{c.level}
                </span>
                <h3 className="text-[16px] font-semibold tracking-tight text-foreground sm:text-[17px]">
                  {c.name}
                </h3>
              </div>
              {c.description ? (
                <div
                  className="constellation-desc mt-2 text-[14.5px] leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: `<p>${renderConstellationDescription(c.description)}</p>`,
                  }}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
