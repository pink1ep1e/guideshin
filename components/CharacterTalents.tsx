"use client";

import { useState, type CSSProperties } from "react";
import {
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
      : t.stats?.[0]?.values.map((_, i) => `Ур. ${i + 1}`) || [];

  return (
    <section className="talent-panel overflow-hidden rounded-[20px] bg-[#0d1a32] p-4 text-white shadow-panel ring-1 ring-white/[0.06] sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="font-genshin text-[1.25rem] tracking-wide text-white/95">
          Таланты
        </h2>
        <span className="h-px flex-1 bg-gradient-to-r from-white/25 via-white/10 to-transparent" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2.5 sm:gap-3">
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
              className={`talent-key group relative flex h-[64px] w-[64px] items-center justify-center rounded-full transition sm:h-[72px] sm:w-[72px] ${
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
              <span className="relative z-[1] flex h-[44px] w-[44px] items-center justify-center overflow-hidden rounded-full bg-[#0a1224] sm:h-[48px] sm:w-[48px]">
                {item.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.icon}
                    alt=""
                    className={`h-[34px] w-[34px] object-contain transition sm:h-[38px] sm:w-[38px] ${
                      on ? "brightness-110" : "opacity-80 group-hover:opacity-100"
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

      <div className="grid gap-4 rounded-[16px] bg-[#132238] p-3 ring-1 ring-white/[0.05] sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] sm:p-4">
        <div className="overflow-hidden rounded-[14px] bg-[#0a1224]">
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
            <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-[#152a48] to-[#0a1224] text-sm text-white/40">
              Нет видео
            </div>
          )}
          <div className="bg-black/50 py-2 text-center text-[13px] font-medium tracking-wide text-white/75">
            Просмотр
          </div>
        </div>

        <div className="min-w-0 px-1 py-1 sm:px-2">
          <h3 className="font-genshin text-[1.35rem] leading-tight tracking-wide text-white sm:text-[1.5rem]">
            {t.name}
          </h3>
          {t.description ? (
            <div
              className="talent-desc mt-3 space-y-3 text-[14.5px] leading-relaxed text-white/85"
              dangerouslySetInnerHTML={{
                __html: `<p>${renderTalentDescription(t.description)}</p>`,
              }}
            />
          ) : null}
          {t.loreText ? (
            <p className="mt-4 text-[13px] italic leading-relaxed text-white/45">
              {t.loreText}
            </p>
          ) : null}
        </div>
      </div>

      {t.stats && t.stats.length > 0 && levels.length > 0 ? (
        <div className="mt-4 overflow-x-auto rounded-[14px] bg-[#0a1224] ring-1 ring-white/[0.05]">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-white/55">
                <th className="px-3 py-2.5 text-left font-medium" />
                {levels.map((lv) => (
                  <th
                    key={lv}
                    className="whitespace-nowrap px-2 py-2.5 text-center font-semibold"
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
                  className="border-b border-white/[0.05] last:border-0"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-medium text-white/80">
                    {row.label}
                  </td>
                  {levels.map((_, i) => (
                    <td
                      key={i}
                      className="px-2 py-2.5 text-center tabular-nums text-white/90"
                    >
                      {row.values[i] ?? "—"}
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
