"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import GuideCalculators from "@/components/GuideCalculators";
import MaterialCards from "@/components/MaterialCards";
import CharacterTalents from "@/components/CharacterTalents";
import CharacterConstellations from "@/components/CharacterConstellations";
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
import type { CharacterTalent } from "@/lib/character-talents";
import type { CharacterConstellation } from "@/lib/character-constellations";

const TAB_ORDER: GuideTabId[] = [
  "overview",
  "build",
  "gear",
  "teams",
  "leveling",
  "play",
];

const SLOT_ICONS: Record<string, string> = {
  Пески: "/images/artifact-slots/sands.png",
  Кубок: "/images/artifact-slots/goblet.png",
  Корона: "/images/artifact-slots/circlet.png",
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
      <header className="guide-section-head">
        {eyebrow ? <p className="guide-eyebrow">{eyebrow}</p> : null}
        <h2 className="guide-title">{title}</h2>
        {intro ? <p className="guide-intro">{intro}</p> : null}
        {pills?.length ? <ElementPills keys={pills} /> : null}
      </header>
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

function SlotIcon({ slot }: { slot: string }) {
  const src = SLOT_ICONS[slot] || SLOT_ICONS["Пески"];
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef1f4]"
      title={slot}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="h-6 w-6 object-contain opacity-80"
        style={{ filter: "brightness(0) saturate(100%)" }}
      />
    </div>
  );
}

const TIER_STYLE: Record<string, { bg: string; fg: string; band: string }> = {
  S: { bg: "#189b8e", fg: "#fff", band: "bg-[#189b8e]/[0.12]" },
  A: { bg: "#3d7ea6", fg: "#fff", band: "bg-[#f7f9fb]" },
  B: { bg: "#6b7280", fg: "#fff", band: "bg-[#f7f8fa]" },
  C: { bg: "#9ca3af", fg: "#fff", band: "bg-[#fafafa]" },
};

function RankedGear({
  items,
  kind = "weapon",
}: {
  items: GuideRankedItem[];
  kind?: "weapon" | "artifact";
}) {
  const sorted = [...items].sort((a, b) => a.rank - b.rank);
  const tiers = ["S", "A", "B", "C"] as const;
  const byTier = tiers.map((t) => ({
    tier: t,
    items: sorted.filter((it) => tierForRank(it.rank, it.tier) === t),
  }));

  return (
    <div className="space-y-4">
      {byTier.map(({ tier, items: group }) => {
        if (!group.length) return null;
        const st = TIER_STYLE[tier] || TIER_STYLE.C;
        return (
          <div key={tier} className={`guide-tier-band rounded-[16px] p-3 ${st.band}`}>
            <div
              className="guide-tier-label shrink-0"
              style={{ backgroundColor: st.bg, color: st.fg }}
            >
              {tier}
            </div>
            <ul className="min-w-0 space-y-2">
              {group.map((item) => {
                const tip = item.verdict || item.effect;
                return (
                  <li key={item.id}>
                    <div className="flex gap-3 rounded-[14px] bg-white/80 px-2.5 py-2 ring-1 ring-black/[0.04]">
                      <ItemHoverPreview
                        name={item.name}
                        image={item.image}
                        lore={[item.effect, item.verdict].filter(Boolean).join("\n\n")}
                        rarityStars={item.rarity >= 5 ? 5 : 4}
                        fit="contain"
                        className="shrink-0"
                      >
                        <div
                          className="relative h-[56px] w-[56px] overflow-hidden rounded-[12px] bg-cover bg-center ring-1 ring-black/[0.06]"
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
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                            <StarRow stars={item.rarity >= 5 ? 5 : 4} />
                          </div>
                        </div>
                      </ItemHoverPreview>
                      <div className="min-w-0 flex-1 self-center">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="text-[15px] font-medium text-foreground hover:text-[#189b8e]"
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="text-[15px] font-medium text-foreground">
                              {item.name}
                            </span>
                          )}
                          {item.subtitle ? (
                            <span className="text-[12px] text-muted-foreground">
                              {item.subtitle}
                            </span>
                          ) : null}
                        </div>
                        {tip ? (
                          <p className="mt-0.5 text-[13.5px] leading-snug text-muted-foreground">
                            {tip}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <p className="text-[13px] text-muted-foreground">
        {kind === "artifact"
          ? "Тир-лист сетов: S — лучший выбор, ниже — рабочие альтернативы. Наведите на иконку."
          : "Тир-лист оружия: S — приоритет, ниже — сильные альтернативы. Наведите на иконку."}
      </p>
    </div>
  );
}

function MaterialRowList({
  items,
}: {
  items: { id: string; name: string; image: string; rarity: 4 | 5; qty?: string; note: string; href?: string }[];
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-[14px] bg-[#f7f9fb] px-2.5 py-2"
        >
          <ItemIconCard
            name={item.name}
            image={item.image}
            rarityStars={item.rarity >= 5 ? 5 : item.rarity >= 4 ? 4 : 3}
            size="sm"
            compact
            lore={item.note || undefined}
            href={item.href}
            preview
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] text-foreground" title={item.name}>
              {item.name}
            </p>
            {item.qty ? (
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#189b8e]">
                ×{item.qty}
              </p>
            ) : item.note ? (
              <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{item.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function splitOverviewBody(body: string): { facts: string[]; rest: string } {
  const m = body.match(/###\s*Кратко\s*\n([\s\S]*?)(?=\n###|\n##|$)/i);
  if (!m) return { facts: [], rest: body };
  const facts = m[1]
    .split("\n")
    .map((l) =>
      l
        .replace(/^[-*•]\s*/, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .trim(),
    )
    .filter(Boolean);
  const rest = (body.slice(0, m.index) + body.slice(m.index! + m[0].length)).trim();
  return { facts, rest };
}

function OverviewFacts({ facts }: { facts: string[] }) {
  if (!facts.length) return null;
  return (
    <ul className="mb-5 grid gap-2 sm:grid-cols-2">
      {facts.map((f, i) => (
        <li
          key={i}
          className="rounded-[14px] bg-[#f7f9fb] px-3.5 py-2.5 text-[14px] leading-snug text-foreground/90"
        >
          {f}
        </li>
      ))}
    </ul>
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
    <article className="overflow-hidden rounded-[16px] bg-[#f7f9fb] ring-1 ring-black/[0.04]">
      {v.badge ? (
        <div className="border-b border-black/[0.04] px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#189b8e]">
            {v.badge}
          </span>
        </div>
      ) : null}
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.75fr)]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {v.members.map((m, i) => (
            <MemberPortrait key={m.id} m={m} role={(m.role && m.role.trim()) || roles[i]} />
          ))}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Особенности
          </p>
          <p className="text-[14.5px] leading-relaxed text-muted-foreground">{v.features}</p>
        </div>
      </div>
    </article>
  );
}

function BlockView({ block }: { block: GuideBlock }) {
  if (block.type === "text") {
    const isOverview = /обзор|кратко|роль/i.test(`${block.title}\n${block.eyebrow || ""}`);
    const { facts, rest } = isOverview
      ? splitOverviewBody(block.body)
      : { facts: [] as string[], rest: block.body };
    const html = renderLiteMarkdown(rest);
    if (!html && !block.title && !facts.length) return null;
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title || "Раздел"}
        pills={elementsMentioned(`${block.title}\n${block.body}`).slice(0, 4)}
      >
        <OverviewFacts facts={facts} />
        <Md html={html} />
      </SectionChrome>
    );
  }

  if (block.type === "prosCons") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[14px] border-l-[3px] border-l-[#189b8e] bg-[#f7f9fb] p-4">
            <h3 className="mb-2.5 text-[14px] font-semibold text-[#189b8e]">
              {block.prosTitle || "Преимущества"}
            </h3>
            <ul className="list-disc space-y-2 pl-4 text-[14.5px] leading-relaxed text-muted-foreground">
              {block.pros.filter(Boolean).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] border-l-[3px] border-l-[#c45c5c] bg-[#f7f9fb] p-4">
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
                  <SlotIcon slot={s.slot} />
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
    const kind = /артефакт|сет/i.test(`${block.title}\n${block.eyebrow || ""}`)
      ? "artifact"
      : "weapon";
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title} intro={block.intro}>
        <RankedGear items={block.items} kind={kind} />
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
            <div key={m.id} className="rounded-[14px] bg-[#f7f9fb] px-2 py-3">
              <MemberPortrait m={m} role={(m.role && m.role.trim()) || roles[i]} />
            </div>
          ))}
        </div>
        {block.note ? (
          <p className="border-t border-black/[0.04] bg-[#f7f9fb] px-4 py-3 text-[14px] leading-relaxed text-muted-foreground">
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
        <MaterialRowList items={block.items} />
      </SectionChrome>
    );
  }

  return null;
}

export default function CharacterGuideView({
  characterName,
  element,
  blocks,
  materials,
  talents = [],
  constellations = [],
  loreByName = {},
}: {
  characterName: string;
  element: string;
  blocks: GuideBlock[];
  materials: CharacterMaterial[];
  talents?: CharacterTalent[];
  constellations?: CharacterConstellation[];
  loreByName?: Record<string, string>;
}) {
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
    () =>
      TAB_ORDER.filter(
        (id) =>
          id === "leveling" ||
          grouped[id].length > 0 ||
          (id === "build" && talents.length > 0) ||
          (id === "play" && constellations.length > 0),
      ),
    [grouped, talents.length, constellations.length],
  );

  const [tab, setTab] = useState<GuideTabId>(availableTabs[0] || "overview");
  const active = availableTabs.includes(tab) ? tab : availableTabs[0] || "overview";

  return (
    <div className="space-y-8 sm:space-y-10">
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

      <div className="space-y-10 sm:space-y-12">
        {active === "leveling" ? (
          <>
            <GuideCalculators characterName={characterName} />
            <MaterialCards materials={materials} loreByName={loreByName} />
            {grouped.leveling.map((b) => (
              <BlockView key={b.id} block={b} />
            ))}
          </>
        ) : active === "build" ? (
          <>
            {grouped.build.map((b) => (
              <BlockView key={b.id} block={b} />
            ))}
            <CharacterTalents talents={talents} element={element} />
          </>
        ) : active === "play" ? (
          <>
            {grouped.play.map((b) => (
              <BlockView key={b.id} block={b} />
            ))}
            <CharacterConstellations constellations={constellations} />
          </>
        ) : (
          grouped[active].map((b) => <BlockView key={b.id} block={b} />)
        )}
      </div>
    </div>
  );
}
