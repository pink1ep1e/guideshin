"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import GuideCalculators from "@/components/GuideCalculators";
import MaterialCards from "@/components/MaterialCards";
import ItemIconCard from "@/components/ItemIconCard";
import ItemHoverPreview from "@/components/ItemHoverPreview";
import {
  classifyGuideBlock,
  GUIDE_TAB_LABELS,
  renderLiteMarkdown,
  youtubeEmbedUrl,
  type GuideBlock,
  type GuideRankedItem,
  type GuideTabId,
  type GuideTeamMember,
  type GuideTeamVariant,
} from "@/lib/guide-builder";
import { ELEMENT_SVG, ELEMENT_THEME, rarityBg, type ElementKey } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

const TAB_ORDER: GuideTabId[] = [
  "overview",
  "build",
  "gear",
  "teams",
  "leveling",
  "play",
];

const SLOT_ICONS: Record<string, string> = {
  Цветок: "/images/artifact-slots/flower.svg",
  Перо: "/images/artifact-slots/plume.svg",
  Пески: "/images/artifact-slots/sands.svg",
  Кубок: "/images/artifact-slots/goblet.svg",
  Корона: "/images/artifact-slots/circlet.svg",
};

const ELEMENT_RU: { key: ElementKey; label: string }[] = [
  { key: "PYRO", label: "Пиро" },
  { key: "HYDRO", label: "Гидро" },
  { key: "ANEMO", label: "Анемо" },
  { key: "ELECTRO", label: "Электро" },
  { key: "DENDRO", label: "Дендро" },
  { key: "CRYO", label: "Крио" },
  { key: "GEO", label: "Гео" },
];

function elementsMentioned(text: string): ElementKey[] {
  const found: ElementKey[] = [];
  for (const { key, label } of ELEMENT_RU) {
    if (new RegExp(label, "i").test(text)) found.push(key);
  }
  return found;
}

function tierForRank(rank: number, explicit?: string): string {
  if (explicit) return explicit;
  if (rank <= 2) return "S";
  if (rank <= 5) return "A";
  if (rank <= 8) return "B";
  return "C";
}

function Md({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div
      className="guide-html guide-md text-[15px] leading-[1.7]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ElementPills({ keys }: { keys: ElementKey[] }) {
  if (!keys.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {keys.map((key) => {
        const theme = ELEMENT_THEME[key];
        const meta = ELEMENT_RU.find((e) => e.key === key);
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-white"
            style={{ backgroundColor: theme.solid }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ELEMENT_SVG[key]}
              alt=""
              className="h-4 w-4 brightness-0 invert"
            />
            {meta?.label}
          </span>
        );
      })}
    </div>
  );
}

function SectionChrome({
  eyebrow,
  title,
  intro,
  children,
  pills,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  pills?: ElementKey[];
}) {
  return (
    <section className="rounded-[20px] bg-white p-5 shadow-panel ring-1 ring-black/[0.04] sm:p-6">
      {eyebrow ? (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#189b8e]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-genshin text-[1.4rem] tracking-wide text-foreground sm:text-[1.55rem]">
        {title}
      </h2>
      {intro ? (
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {intro}
        </p>
      ) : null}
      {pills?.length ? <ElementPills keys={pills} /> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StarRow({ stars }: { stars: number }) {
  const n = Math.min(5, Math.max(1, stars));
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/images/stars/Quality_star_${n}.svg`}
      alt={`${n}★`}
      className="h-3.5 w-auto"
    />
  );
}

function MemberPortrait({ m, role }: { m: GuideTeamMember; role?: string }) {
  const bg = m.rarity === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg";
  const body = (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <div
        className="relative h-[80px] w-[80px] overflow-hidden rounded-[16px] bg-cover bg-center ring-1 ring-black/[0.06] sm:h-[88px] sm:w-[88px]"
        style={{ backgroundImage: `url(${bg})` }}
      >
        {m.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.image} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {m.name.slice(0, 1)}
          </span>
        )}
        {m.elementIcon ? (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.elementIcon} alt="" className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 w-full">
        {role ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#189b8e]">
            {role}
          </p>
        ) : null}
        <p className="truncate text-[14px] font-medium text-foreground">{m.name}</p>
      </div>
    </div>
  );
  return m.href ? (
    <Link href={m.href} className="block hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

function TeamVariantCard({ v }: { v: GuideTeamVariant }) {
  const roles = ["Мейн-дд", "Саппорт", "Саб-дд", "Флекс"];
  return (
    <article className="overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.05]">
      {v.badge ? (
        <div className="border-b border-black/[0.04] px-4 py-2.5">
          <span className="rounded-md bg-[#189b8e]/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#189b8e]">
            {v.badge}
          </span>
        </div>
      ) : null}
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
          {v.members.map((m, i) => (
            <div key={m.id} className="rounded-[14px] bg-[#f6f8fa] px-2 py-3">
              <MemberPortrait m={m} role={(m.role && m.role.trim()) || roles[i]} />
            </div>
          ))}
        </div>
        <div className="border-t border-black/[0.04] bg-[#f6f8fa] px-4 py-4 sm:border-l sm:border-t-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#189b8e]">
            Особенности
          </p>
          <p className="text-[14px] leading-relaxed text-foreground/85">{v.features}</p>
        </div>
      </div>
    </article>
  );
}

/** Упрощённый рейтинг: карточка + коротко «зачем» */
function RankedGear({ items }: { items: GuideRankedItem[] }) {
  const sorted = [...items].sort((a, b) => a.rank - b.rank);

  return (
    <div className="space-y-2.5">
      {sorted.map((item, idx) => {
        const tier = tierForRank(item.rank, item.tier);
        const isTop = idx === 0;
        const tip = item.verdict || item.effect;
        const card = (
          <div
            className={`flex gap-3.5 rounded-[16px] p-3 sm:gap-4 sm:p-3.5 ${
              isTop
                ? "bg-[#189b8e]/[0.08] ring-1 ring-[#189b8e]/25"
                : "bg-[#f7f9fb] ring-1 ring-black/[0.04]"
            }`}
          >
            <ItemHoverPreview
              name={item.name}
              image={item.image}
              lore={[item.effect, item.verdict].filter(Boolean).join("\n\n")}
              rarityStars={item.rarity >= 5 ? 5 : 4}
              fit="contain"
              className="shrink-0"
            >
              <div
                className="relative h-[72px] w-[72px] overflow-hidden rounded-[14px] bg-cover bg-center ring-1 ring-black/[0.06] sm:h-[80px] sm:w-[80px]"
                style={{
                  backgroundImage: `url(${rarityBg(item.rarity >= 5 ? 5 : 4)})`,
                }}
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-contain p-1"
                  />
                ) : null}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                  <StarRow stars={item.rarity >= 5 ? 5 : 4} />
                </div>
              </div>
            </ItemHoverPreview>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {isTop ? (
                  <span className="rounded-md bg-[#189b8e] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Топ
                  </span>
                ) : (
                  <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
                    #{item.rank}
                  </span>
                )}
                <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-[#189b8e] ring-1 ring-black/[0.05]">
                  {tier}
                </span>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-[15px] font-medium text-foreground hover:text-[#189b8e]"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-[15px] font-medium text-foreground">{item.name}</span>
                )}
                {item.subtitle ? (
                  <span className="text-[13px] text-muted-foreground">{item.subtitle}</span>
                ) : null}
              </div>
              {tip ? (
                <p className="mt-1.5 text-[14px] leading-snug text-muted-foreground">
                  {tip}
                </p>
              ) : null}
            </div>
          </div>
        );
        return <div key={item.id}>{card}</div>;
      })}
      <p className="text-[13px] text-muted-foreground">
        Наведите на иконку — кратко об эффекте. Приоритет сверху вниз.
      </p>
    </div>
  );
}

function BlockView({ block }: { block: GuideBlock }) {
  if (block.type === "text") {
    const html = renderLiteMarkdown(block.body);
    if (!html && !block.title) return null;
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title || "Раздел"}
        pills={elementsMentioned(`${block.title}\n${block.body}`).slice(0, 4)}
      >
        <Md html={html} />
      </SectionChrome>
    );
  }

  if (block.type === "prosCons") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[14px] border-l-[3px] border-l-[#189b8e] bg-[#f8fafb] p-4">
            <h3 className="mb-2.5 text-[14px] font-semibold text-[#189b8e]">
              {block.prosTitle || "Преимущества"}
            </h3>
            <ul className="list-disc space-y-2 pl-4 text-[14.5px] leading-relaxed text-muted-foreground">
              {block.pros.filter(Boolean).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] border-l-[3px] border-l-[#c45c5c] bg-[#f8fafb] p-4">
            <h3 className="mb-2.5 text-[14px] font-semibold text-[#c45c5c]">
              {block.consTitle || "Недостатки"}
            </h3>
            <ul className="list-disc space-y-2 pl-4 text-[14.5px] leading-relaxed text-muted-foreground">
              {block.cons.filter(Boolean).map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionChrome>
    );
  }

  if (block.type === "statTargets") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title} intro={block.intro}>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {block.targets.map((t) => (
            <div key={t.id} className="rounded-[14px] bg-[#f7f9fb] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.label}
              </p>
              <p className="mt-1 font-genshin text-[20px] tracking-wide text-foreground">
                {t.value}
              </p>
              {t.hint ? (
                <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{t.hint}</p>
              ) : null}
            </div>
          ))}
        </div>
        {block.slots.length > 0 ? (
          <div className="mt-5 space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Основные статы по слотам
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {block.slots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-[14px] bg-[#f7f9fb] px-3 py-2.5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={SLOT_ICONS[s.slot] || SLOT_ICONS["Цветок"]}
                    alt=""
                    className="h-11 w-11 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[13px] text-muted-foreground">{s.slot}</p>
                    <p className="text-[15px] font-semibold text-[#189b8e]">{s.main}</p>
                    <p className="truncate text-[13px] text-muted-foreground" title={s.subs}>
                      {s.subs}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SectionChrome>
    );
  }

  if (block.type === "rankedList") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title} intro={block.intro}>
        <RankedGear items={block.items} />
      </SectionChrome>
    );
  }

  if (block.type === "setPlan") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title} intro={block.intro}>
        <div className="space-y-6">
          {block.groups.map((g) => (
            <div key={g.id}>
              <h3 className="mb-3 text-[15px] font-semibold text-foreground">{g.title}</h3>
              <div className="space-y-2">
                {g.rows.map((r) => {
                  const left = (
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-cover bg-center ring-1 ring-black/[0.05]"
                        style={{ backgroundImage: "url(/images/legend-bg.jpg)" }}
                      >
                        {r.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.image}
                            alt=""
                            className="h-full w-full object-cover object-top"
                          />
                        ) : null}
                      </div>
                      <span className="truncate text-[15px] text-foreground">{r.name}</span>
                    </div>
                  );
                  return (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f7f9fb] px-3 py-2.5"
                    >
                      {r.href ? (
                        <Link href={r.href} className="min-w-0 hover:opacity-90">
                          {left}
                        </Link>
                      ) : (
                        left
                      )}
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="truncate text-right text-[14px] text-muted-foreground">
                          {r.setName}
                        </span>
                        {r.setImage ? (
                          <ItemHoverPreview
                            name={r.setName}
                            image={r.setImage}
                            rarityStars={5}
                            fit="contain"
                            className="shrink-0"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.setImage}
                              alt=""
                              className="h-11 w-11 rounded-[10px] object-contain ring-1 ring-black/[0.05]"
                            />
                          </ItemHoverPreview>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionChrome>
    );
  }

  if (block.type === "teamGroup") {
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title}
        intro={block.intro}
        pills={elementsMentioned(`${block.title}\n${block.intro}`)}
      >
        <div className="space-y-3">
          {block.variants.map((v) => (
            <TeamVariantCard key={v.id} v={v} />
          ))}
        </div>
      </SectionChrome>
    );
  }

  if (block.type === "team") {
    const roles = ["Мейн-дд", "Саппорт", "Саб-дд", "Флекс"];
    return (
      <article className="overflow-hidden rounded-[18px] bg-white ring-1 ring-black/[0.05]">
        <div className="flex items-center gap-2 border-b border-black/[0.04] px-4 py-2.5">
          <h3 className="text-[15px] font-semibold">{block.title}</h3>
          {block.badge ? (
            <span className="rounded-md bg-[#189b8e]/12 px-2.5 py-1 text-[11px] font-semibold uppercase text-[#189b8e]">
              {block.badge}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:p-4">
          {block.members.map((m, i) => (
            <div key={m.id} className="rounded-[14px] bg-[#f6f8fa] px-2 py-3">
              <MemberPortrait m={m} role={(m.role && m.role.trim()) || roles[i]} />
            </div>
          ))}
        </div>
        {block.note ? (
          <p className="border-t border-black/[0.04] bg-[#f6f8fa] px-4 py-3 text-[14px] leading-relaxed text-muted-foreground">
            {block.note}
          </p>
        ) : null}
      </article>
    );
  }

  if (block.type === "roleTable") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title} intro={block.intro}>
        <div className="space-y-2">
          {block.rows.map((r) => (
            <div
              key={r.id}
              className="flex gap-3.5 rounded-[14px] bg-[#f7f9fb] p-3"
            >
              <div
                className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[14px] bg-cover bg-center ring-1 ring-black/[0.05]"
                style={{ backgroundImage: "url(/images/legend-bg.jpg)" }}
              >
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" className="h-full w-full object-cover object-top" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {r.href ? (
                    <Link
                      href={r.href}
                      className="text-[15px] font-medium text-[#189b8e] hover:underline"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    <span className="text-[15px] font-medium">{r.name}</span>
                  )}
                  {r.elementIcon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.elementIcon} alt="" className="h-4 w-4" />
                  ) : null}
                  <span className="text-[13px] text-muted-foreground">
                    {r.element} · {r.weapon}
                  </span>
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                  {r.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SectionChrome>
    );
  }

  if (block.type === "resourceTable") {
    return (
      <SectionChrome title={block.title} intro={block.intro}>
        <div className="space-y-2">
          {block.rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-[14px] bg-[#f7f9fb] px-3 py-2.5"
            >
              {r.image ? (
                <ItemHoverPreview
                  name={r.name}
                  image={r.image}
                  rarityStars={4}
                  fit="contain"
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt="" className="h-11 w-11 object-contain" />
                </ItemHoverPreview>
              ) : null}
              <div className="min-w-0 flex-1">
                {r.href ? (
                  <Link href={r.href} className="text-[15px] font-medium text-[#189b8e] hover:underline">
                    {r.name}
                  </Link>
                ) : (
                  <span className="text-[15px] font-medium">{r.name}</span>
                )}
                <p className="text-[13px] text-muted-foreground">{r.where}</p>
              </div>
              {r.qty ? (
                <span className="rounded-md bg-[#189b8e]/12 px-2.5 py-1 text-[13px] font-semibold tabular-nums text-[#189b8e]">
                  ×{r.qty}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </SectionChrome>
    );
  }

  if (block.type === "statsTable") {
    return (
      <SectionChrome title={block.title} intro={block.intro}>
        <div className="overflow-x-auto rounded-[14px] ring-1 ring-black/[0.05]">
          <table className="w-full min-w-[520px] text-[14px]">
            <thead>
              <tr className="bg-[#f5f7f9] text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-foreground/65">
                {block.colLabels.map((c) => (
                  <th key={c} className="px-2 py-2.5">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r) => (
                <tr key={r.id} className="border-t border-black/[0.04] text-center">
                  <td className="px-2 py-2.5 font-medium">{r.level}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{r.hp}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{r.atk}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{r.def}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{r.baseStat}</td>
                  <td className="px-2 py-2.5 font-medium text-[#189b8e]">{r.ascStat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionChrome>
    );
  }

  if (block.type === "video") {
    const yt = youtubeEmbedUrl(block.youtubeUrl);
    if (!yt && !block.videoUrl) return null;
    return (
      <SectionChrome title={block.title || "Видео"}>
        {yt ? (
          <div className="relative w-full overflow-hidden rounded-[16px] bg-black pt-[56.25%]">
            <iframe
              src={yt}
              title={block.title}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        ) : (
          <video className="w-full rounded-[16px]" controls preload="metadata" src={block.videoUrl} />
        )}
      </SectionChrome>
    );
  }

  if (block.type === "weapons" || block.type === "artifacts" || block.type === "materials") {
    if (!block.items.length) return null;
    return (
      <SectionChrome
        title={block.title}
        eyebrow={
          block.type === "weapons"
            ? "Оружие"
            : block.type === "artifacts"
              ? "Артефакты"
              : "Материалы"
        }
      >
        <ul className="flex flex-wrap gap-2.5">
          {block.items.map((item) => (
            <li key={item.id}>
              <ItemIconCard
                name={item.name}
                image={item.image}
                rarityStars={item.rarity >= 5 ? 5 : 4}
                qty={item.qty}
                href={item.href}
                size="md"
                lore={item.note || undefined}
                preview
              />
            </li>
          ))}
        </ul>
      </SectionChrome>
    );
  }

  return null;
}

export default function CharacterGuideView({
  characterName,
  element: _element,
  blocks,
  materials,
  loreByName = {},
}: {
  characterName: string;
  element: string;
  blocks: GuideBlock[];
  materials: CharacterMaterial[];
  loreByName?: Record<string, string>;
}) {
  void _element;

  const grouped = useMemo(() => {
    const map: Record<GuideTabId, GuideBlock[]> = {
      overview: [],
      build: [],
      gear: [],
      teams: [],
      leveling: [],
      play: [],
    };
    for (const b of blocks) map[classifyGuideBlock(b)].push(b);
    return map;
  }, [blocks]);

  const availableTabs = useMemo(
    () => TAB_ORDER.filter((id) => id === "leveling" || grouped[id].length > 0),
    [grouped],
  );

  const [tab, setTab] = useState<GuideTabId>(availableTabs[0] || "overview");
  const active = availableTabs.includes(tab) ? tab : availableTabs[0] || "overview";

  return (
    <div className="space-y-4">
      <nav
        className="rounded-[16px] bg-white p-1.5 shadow-panel ring-1 ring-black/[0.05]"
        aria-label="Разделы гайда"
      >
        <div className="flex flex-wrap gap-1">
          {availableTabs.map((id) => {
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-[12px] px-3.5 py-2.5 text-[14px] transition sm:flex-1 ${
                  on
                    ? "bg-[#189b8e] font-semibold text-white"
                    : "font-medium text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
                }`}
              >
                {GUIDE_TAB_LABELS[id]}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-4">
        {active === "leveling" ? (
          <>
            <GuideCalculators characterName={characterName} />
            <MaterialCards materials={materials} loreByName={loreByName} />
            {grouped.leveling.map((b) => (
              <BlockView key={b.id} block={b} />
            ))}
          </>
        ) : (
          grouped[active].map((b) => <BlockView key={b.id} block={b} />)
        )}
      </div>
    </div>
  );
}
