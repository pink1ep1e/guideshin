"use client";

import { useState, type CSSProperties } from "react";
import {
  defaultTalentLevelLabels,
  renderTalentDescription,
  type CharacterTalent,
} from "@/lib/character-talents";
import { getElementTheme } from "@/lib/genshin";

type Props = {
  talents: CharacterTalent[];
  element: string;
};

export default function CharacterTalents({ talents, element }: Props) {
  const [active, setActive] = useState(0);
  if (!talents.length) return null;

  const theme = getElementTheme(element);
  const t = talents[Math.min(active, talents.length - 1)];
  const levels =
    t.levelLabels && t.levelLabels.length
      ? t.levelLabels
      : t.stats?.[0]?.values.length
        ? defaultTalentLevelLabels().slice(0, t.stats[0].values.length)
        : defaultTalentLevelLabels();

  return (
    <section className="guide-section">
      <header className="guide-section-head">
        <p className="guide-eyebrow">Билд</p>
        <h2 className="guide-title">Таланты</h2>
      </header>

      <div className="mt-5 flex flex-wrap gap-2 sm:gap-2.5">
        {talents.map((item, i) => {
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
              className={`talent-key group relative flex h-[56px] w-[56px] items-center justify-center rounded-full transition sm:h-[64px] sm:w-[64px] ${
                on ? "talent-key--active" : "talent-key--idle"
              }`}
              style={elStyle}
              aria-pressed={on}
              title={item.name}
            >
              {on ? (
                <span
                  className="talent-key-ring pointer-events-none absolute inset-[-2px]"
                  style={{ color: theme.solid }}
                  aria-hidden
                />
              ) : (
                <span className="talent-key-idle-ring" aria-hidden />
              )}
              <span className="relative z-[1] flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full bg-[#0f172a] sm:h-[44px] sm:w-[44px]">
                {item.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.icon}
                    alt=""
                    className={`h-[30px] w-[30px] object-contain transition sm:h-[34px] sm:w-[34px] ${
                      on ? "brightness-110" : "opacity-75 group-hover:opacity-100"
                    }`}
                  />
                ) : (
                  <span className="text-xs text-white/40">{i + 1}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 border-t border-black/[0.06] pt-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <div className="overflow-hidden rounded-[14px] bg-[#0f172a]">
          {t.videoUrl ? (
            <video
              key={t.videoUrl}
              className="aspect-video w-full object-cover"
              controls
              playsInline
              preload="metadata"
              src={t.videoUrl}
            />
          ) : (
            <div className="flex aspect-video items-center justify-center text-sm text-white/40">
              Нет видео
            </div>
          )}
          <div className="bg-black/40 py-2 text-center text-[12px] font-medium tracking-wide text-white/70">
            Просмотр
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-[1.25rem] font-semibold tracking-tight text-foreground sm:text-[1.35rem]">
            {t.name}
          </h3>
          {t.description ? (
            <div
              className="talent-desc mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: `<p>${renderTalentDescription(t.description)}</p>`,
              }}
            />
          ) : null}
          {t.loreText ? (
            <p className="mt-4 text-[13px] italic leading-relaxed text-muted-foreground/80">
              {t.loreText}
            </p>
          ) : null}
        </div>
      </div>

      {t.stats && t.stats.length > 0 && levels.length > 0 ? (
        <div className="mt-5 overflow-x-auto border-t border-black/[0.06] pt-4">
          <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-black/[0.06] text-muted-foreground">
                <th className="px-2 py-2 text-left font-medium" />
                {levels.map((lv) => (
                  <th
                    key={lv}
                    className="whitespace-nowrap px-1.5 py-2 text-center font-semibold tabular-nums"
                  >
                    {lv}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.stats.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-black/[0.04] last:border-0"
                >
                  <td className="whitespace-nowrap px-2 py-2 font-medium text-foreground/85">
                    {row.label}
                  </td>
                  {levels.map((_, i) => (
                    <td
                      key={i}
                      className="px-1.5 py-2 text-center tabular-nums text-muted-foreground"
                    >
                      {row.values[i] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
