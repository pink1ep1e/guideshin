"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import GuideCalculators from "@/components/GuideCalculators";
import MaterialCards from "@/components/MaterialCards";
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
import { rarityBg, ELEMENT_SVG, ELEMENT_THEME, type ElementKey } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

const TAB_ORDER: GuideTabId[] = [
  "overview",
  "build",
  "gear",
  "teams",
  "leveling",
  "play",
];

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
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: theme.solid }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ELEMENT_SVG[key]} alt="" className="h-4 w-4 drop-shadow" />
            {meta?.label}
          </span>
        );
      })}
    </div>
  );
}

function tierForRank(rank: number, explicit?: string): string {
  if (explicit) return explicit;
  if (rank <= 2) return "S";
  if (rank <= 5) return "A";
  if (rank <= 8) return "B";
  return "C";
}

function tierClass(tier: string) {
  if (tier === "S") return "bg-[#189b8e] text-white";
  if (tier === "A") return "bg-[#0b1f44]/[0.78] text-white";
  if (tier === "B") return "bg-[#0b1f44]/[0.12] text-foreground";
  return "bg-black/[0.06] text-muted-foreground";
}

function Md({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div
      className="guide-html guide-md"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function SectionChrome({
  eyebrow,
  title,
  intro,
  children,
  accent = false,
  rich = false,
  pills,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  accent?: boolean;
  /** Более выразительный хедер для текстовых блоков */
  rich?: boolean;
  pills?: ElementKey[];
}) {
  return (
    <section
      className={`overflow-hidden rounded-[20px] border ${
        accent
          ? "border-[#189b8e]/30 bg-gradient-to-br from-[#189b8e]/[0.08] via-white to-white"
          : rich
            ? "border-black/[0.06] bg-white shadow-[0_10px_30px_-18px_rgba(11,31,68,0.35)]"
            : "border-black/[0.05] bg-white"
      }`}
    >
      <div
        className={`relative px-4 pt-4 sm:px-5 sm:pt-5 ${
          rich
            ? "border-b border-black/[0.04] bg-gradient-to-r from-[#0b1f44]/[0.06] via-[#189b8e]/[0.04] to-transparent pb-4"
            : "pb-0"
        }`}
      >
        {rich ? (
          <span
            aria-hidden
            className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-[#189b8e] to-[#0b1f44]"
          />
        ) : null}
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#189b8e]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={`font-genshin tracking-wide text-foreground ${
            rich
              ? "text-[1.35rem] leading-tight sm:text-[1.55rem]"
              : "text-[1.25rem] sm:text-[1.4rem]"
          }`}
        >
          {title}
        </h2>
        {intro ? (
          <p
            className={`mt-2.5 max-w-3xl leading-relaxed text-muted-foreground ${
              rich ? "text-[14.5px]" : "text-[14px]"
            }`}
          >
            {intro}
          </p>
        ) : null}
        {pills?.length ? <ElementPills keys={pills} /> : null}
      </div>
      <div className={`px-4 pb-4 sm:px-5 sm:pb-5 ${rich || intro ? "pt-4" : "pt-4"}`}>
        {children}
      </div>
    </section>
  );
}

function MemberPortrait({
  m,
  role,
  size = "md",
}: {
  m: GuideTeamMember;
  role?: string;
  size?: "md" | "lg";
}) {
  const bg = m.rarity === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg";
  const box = size === "lg" ? "h-[72px] w-[72px] sm:h-[84px] sm:w-[84px]" : "h-16 w-16 sm:h-[72px] sm:w-[72px]";
  const portrait = (
    <div
      className={`relative shrink-0 overflow-hidden rounded-[16px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.08] ${box}`}
      style={{ backgroundImage: `url(${bg})` }}
    >
      {m.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={m.image} alt="" className="h-full w-full object-cover object-top" />
      ) : (
        <span className="flex h-full items-center justify-center px-1 text-center text-[10px] font-semibold text-muted-foreground">
          {m.name.slice(0, 1)}
        </span>
      )}
      {m.elementIcon ? (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.elementIcon} alt="" className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  );

  const body = (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {portrait}
      <div className="min-w-0 w-full">
        {role ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#189b8e]">
            {role}
          </p>
        ) : null}
        <p className="truncate font-genshin text-[13.5px] tracking-wide text-foreground sm:text-[14.5px]">
          {m.name}
        </p>
      </div>
    </div>
  );

  return m.href ? (
    <Link href={m.href} className="block transition hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

function RankedGear({
  items,
  kind,
}: {
  items: GuideRankedItem[];
  kind: "weapons" | "artifacts";
}) {
  const sorted = [...items].sort((a, b) => a.rank - b.rank);
  const [top, ...rest] = sorted;
  if (!top) return null;

  const TopIcon = (
    <div
      className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[16px] bg-cover bg-center ring-1 ring-black/[0.06] sm:h-[104px] sm:w-[104px]"
      style={{ backgroundImage: `url(${rarityBg(top.rarity >= 5 ? 5 : 4)})` }}
    >
      {top.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={top.image} alt="" className="h-full w-full object-contain p-1.5" />
      ) : null}
    </div>
  );

  return (
    <div className="space-y-3">
      <article className="relative overflow-hidden rounded-[18px] border border-[#189b8e]/30 bg-gradient-to-br from-[#189b8e]/[0.09] via-white to-[#f7f9fb] p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#189b8e] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Топ-выбор
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${tierClass(tierForRank(top.rank, top.tier))}`}
          >
            {tierForRank(top.rank, top.tier)}
          </span>
          {top.subtitle ? (
            <span className="text-[12px] text-muted-foreground">{top.subtitle}</span>
          ) : null}
        </div>
        <div className="flex gap-3.5 sm:gap-4">
          {top.href ? (
            <Link href={top.href} className="shrink-0 transition hover:opacity-90">
              {TopIcon}
            </Link>
          ) : (
            TopIcon
          )}
          <div className="min-w-0 flex-1">
            {top.href ? (
              <Link
                href={top.href}
                className="font-genshin text-[1.05rem] tracking-wide text-foreground hover:text-[#189b8e] sm:text-[1.15rem]"
              >
                {top.name}
              </Link>
            ) : (
              <p className="font-genshin text-[1.05rem] tracking-wide text-foreground sm:text-[1.15rem]">
                {top.name}
              </p>
            )}
            {top.effect ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {top.effect}
              </p>
            ) : null}
            {top.verdict ? (
              <p className="mt-2 rounded-[12px] border border-[#189b8e]/20 bg-white/80 px-3 py-2 text-[13px] leading-snug text-[#1a7a70]">
                <span className="font-semibold text-[#189b8e]">Когда брать: </span>
                {top.verdict}
              </p>
            ) : null}
          </div>
        </div>
      </article>

      <div className="space-y-2">
        {rest.map((item) => {
          const tier = tierForRank(item.rank, item.tier);
          const icon = (
            <div
              className="h-14 w-14 shrink-0 overflow-hidden rounded-[12px] bg-cover bg-center ring-1 ring-black/[0.05]"
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
            </div>
          );
          return (
            <article
              key={item.id}
              className="rounded-[14px] border border-black/[0.045] bg-[#f8fafb] p-3 transition hover:border-black/[0.08] hover:bg-white sm:p-3.5"
            >
              <div className="flex gap-3">
                {item.href ? (
                  <Link href={item.href} className="shrink-0">
                    {icon}
                  </Link>
                ) : (
                  icon
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                      #{item.rank}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${tierClass(tier)}`}
                    >
                      {tier}
                    </span>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="font-genshin text-[14px] tracking-wide text-foreground hover:text-[#189b8e]"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-genshin text-[14px] tracking-wide text-foreground">
                        {item.name}
                      </span>
                    )}
                    {item.subtitle ? (
                      <span className="text-[11.5px] text-muted-foreground">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </div>
                  {item.effect ? (
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {item.effect}
                    </p>
                  ) : null}
                  {item.verdict ? (
                    <p className="mt-1.5 border-l-2 border-[#189b8e]/35 pl-2 text-[12.5px] leading-snug text-[#1a7a70]">
                      {item.verdict}
                    </p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {kind === "weapons"
          ? "Приоритет сверху вниз. Ниже — ситуативные и бюджетные варианты."
          : "Сначала полный топ-сет, затем ситуативные и временные 2+2."}
      </p>
    </div>
  );
}

function TeamVariantCard({ v }: { v: GuideTeamVariant }) {
  const roles = ["Мейн-дд", "Саппорт", "Саб-дд", "Флекс"];
  return (
    <article className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_8px_24px_-16px_rgba(11,31,68,0.4)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] bg-[#0b1f44]/[0.03] px-3.5 py-2.5 sm:px-4">
        {v.badge ? (
          <span className="rounded-md bg-[#189b8e] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {v.badge}
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Состав
          </span>
        )}
        <span className="text-[11px] text-muted-foreground">
          {v.members.map((m) => m.name).join(" · ")}
        </span>
      </div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-4 sm:gap-2.5 sm:p-4">
          {v.members.map((m, i) => (
            <div
              key={m.id}
              className="rounded-[14px] bg-[#f5f8f9] px-2 py-2.5 sm:px-2.5 sm:py-3"
            >
              <MemberPortrait
                m={m}
                role={(m.role && m.role.trim()) || roles[i]}
                size="lg"
              />
            </div>
          ))}
        </div>
        <div className="border-t border-black/[0.04] bg-gradient-to-br from-[#0b1f44]/[0.05] to-[#189b8e]/[0.06] px-3.5 py-3.5 sm:border-l sm:border-t-0 sm:px-4 sm:py-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#189b8e]">
            Особенности
          </p>
          <p className="text-[13.5px] leading-relaxed text-foreground/90">{v.features}</p>
        </div>
      </div>
    </article>
  );
}

function BlockView({ block }: { block: GuideBlock }) {
  if (block.type === "text") {
    const html = renderLiteMarkdown(block.body);
    if (!html && !block.title) return null;
    const pills = elementsMentioned(`${block.title}\n${block.body}`);
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title || "Раздел"}
        rich
        pills={pills.slice(0, 4)}
      >
        <Md html={html} />
      </SectionChrome>
    );
  }

  if (block.type === "prosCons") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title} rich>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[14px] border border-black/[0.045] border-l-[3px] border-l-[#189b8e] bg-[#f8fafb] p-4">
            <h3 className="mb-2.5 text-[13px] font-semibold text-[#189b8e]">
              {block.prosTitle || "Преимущества"}
            </h3>
            <ul className="list-disc space-y-2 pl-4 text-[13.5px] leading-relaxed text-muted-foreground">
              {block.pros.filter(Boolean).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] border border-black/[0.045] border-l-[3px] border-l-[#c45c5c] bg-[#f8fafb] p-4">
            <h3 className="mb-2.5 text-[13px] font-semibold text-[#c45c5c]">
              {block.consTitle || "Недостатки"}
            </h3>
            <ul className="list-disc space-y-2 pl-4 text-[13.5px] leading-relaxed text-muted-foreground">
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
            <div
              key={t.id}
              className="rounded-[14px] border border-black/[0.045] bg-[#f7f9fb] px-3.5 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t.label}
              </p>
              <p className="mt-1 font-genshin text-[18px] tracking-wide text-foreground">
                {t.value}
              </p>
              {t.hint ? (
                <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{t.hint}</p>
              ) : null}
            </div>
          ))}
        </div>
        {block.slots.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-[14px] border border-black/[0.05]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f5f7f9] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-foreground/65">
                  <th className="px-3 py-2.5">Слот</th>
                  <th className="px-3 py-2.5">Основная</th>
                  <th className="px-3 py-2.5">Саб-статы</th>
                </tr>
              </thead>
              <tbody>
                {block.slots.map((s) => (
                  <tr key={s.id} className="border-t border-black/[0.04]">
                    <td className="px-3 py-2.5 font-medium text-foreground">{s.slot}</td>
                    <td className="px-3 py-2.5 text-[#189b8e]">{s.main}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{s.subs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionChrome>
    );
  }

  if (block.type === "rankedList") {
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title}
        intro={block.intro}
        accent
      >
        <RankedGear items={block.items} kind={block.kind} />
      </SectionChrome>
    );
  }

  if (block.type === "teamGroup") {
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title}
        intro={block.intro}
        rich
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
      <article className="overflow-hidden rounded-[18px] border border-black/[0.06] bg-white shadow-[0_8px_24px_-16px_rgba(11,31,68,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] bg-[#0b1f44]/[0.03] px-3.5 py-2.5">
          <h3 className="font-display text-[15px] font-semibold">{block.title}</h3>
          {block.badge ? (
            <span className="rounded-md bg-[#189b8e] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {block.badge}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-4">
          {block.members.map((m, i) => (
            <div
              key={m.id}
              className="rounded-[14px] bg-[#f5f8f9] px-2 py-2.5"
            >
              <MemberPortrait
                m={m}
                role={(m.role && m.role.trim()) || roles[i]}
                size="lg"
              />
            </div>
          ))}
        </div>
        {block.note ? (
          <p className="border-t border-black/[0.04] bg-[#f4f7f8] px-3.5 py-3 text-[13.5px] leading-relaxed text-foreground/85">
            {block.note}
          </p>
        ) : null}
      </article>
    );
  }

  if (block.type === "roleTable") {
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title}
        intro={block.intro}
        rich
      >
        <div className="space-y-2.5">
          {block.rows.map((r) => (
            <div
              key={r.id}
              className="flex gap-3.5 rounded-[16px] border border-black/[0.05] bg-[#f7f9fb] p-3 sm:p-3.5"
            >
              <div
                className="h-[68px] w-[68px] shrink-0 overflow-hidden rounded-[14px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.06] sm:h-[76px] sm:w-[76px]"
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
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {r.href ? (
                    <Link
                      href={r.href}
                      className="font-genshin text-[15px] tracking-wide text-[#189b8e] hover:underline"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    <span className="font-genshin text-[15px] tracking-wide text-foreground">
                      {r.name}
                    </span>
                  )}
                  {r.elementIcon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.elementIcon} alt="" className="h-4 w-4" />
                  ) : null}
                  <span className="rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {r.element} · {r.weapon}
                  </span>
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
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
        <div className="overflow-hidden rounded-[14px] border border-black/[0.05]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f5f7f9] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-foreground/65">
                <th className="px-3 py-2.5">Ресурс</th>
                <th className="px-3 py-2.5">Где найти</th>
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r) => (
                <tr key={r.id} className="border-t border-black/[0.04]">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.image}
                          alt=""
                          className="h-9 w-9 object-contain"
                        />
                      ) : null}
                      <div>
                        {r.href ? (
                          <Link
                            href={r.href}
                            className="font-medium text-[#189b8e] hover:underline"
                          >
                            {r.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{r.name}</span>
                        )}
                        {r.qty ? (
                          <span className="ml-1.5 text-[#189b8e]">×{r.qty}</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{r.where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionChrome>
    );
  }

  if (block.type === "statsTable") {
    return (
      <SectionChrome title={block.title} intro={block.intro}>
        <div className="overflow-x-auto rounded-[14px] border border-black/[0.05]">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="bg-[#f5f7f9] text-center text-[10px] font-semibold uppercase tracking-[0.05em] text-foreground/65">
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
                  <td className="px-2 py-2 font-medium">{r.level}</td>
                  <td className="px-2 py-2 text-muted-foreground">{r.hp}</td>
                  <td className="px-2 py-2 text-muted-foreground">{r.atk}</td>
                  <td className="px-2 py-2 text-muted-foreground">{r.def}</td>
                  <td className="px-2 py-2 text-muted-foreground">{r.baseStat}</td>
                  <td className="px-2 py-2 font-medium text-[#189b8e]">{r.ascStat}</td>
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
          <div className="guide-video relative w-full overflow-hidden rounded-[16px] bg-black pt-[56.25%]">
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
          <video
            className="w-full rounded-[16px]"
            controls
            preload="metadata"
            src={block.videoUrl}
          />
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
        <div className="grid gap-1.5 sm:grid-cols-2">
          {block.items.map((item) => {
            const stars = item.rarity >= 5 ? 5 : 4;
            const row = (
              <div className="flex items-center gap-2 rounded-[12px] border border-black/[0.04] bg-[#f7f9fb] px-2 py-1.5">
                <div
                  className="h-10 w-10 shrink-0 overflow-hidden rounded-[9px] bg-cover bg-center"
                  style={{ backgroundImage: `url(${rarityBg(stars)})` }}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-contain p-0.5"
                    />
                  ) : null}
                </div>
                <span className="min-w-0 flex-1 truncate text-[12.5px]">{item.name}</span>
                {item.qty ? (
                  <span className="shrink-0 text-[12px] font-semibold text-[#189b8e]">
                    ×{item.qty}
                  </span>
                ) : null}
              </div>
            );
            return item.href ? (
              <Link key={item.id} href={item.href} className="transition hover:opacity-90">
                {row}
              </Link>
            ) : (
              <div key={item.id}>{row}</div>
            );
          })}
        </div>
      </SectionChrome>
    );
  }

  return null;
}

export default function CharacterGuideView({
  characterName,
  blocks,
  materials,
  loreByName = {},
}: {
  characterName: string;
  blocks: GuideBlock[];
  materials: CharacterMaterial[];
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
    for (const b of blocks) {
      map[classifyGuideBlock(b)].push(b);
    }
    return map;
  }, [blocks]);

  const availableTabs = useMemo(
    () =>
      TAB_ORDER.filter(
        (id) => id === "leveling" || grouped[id].length > 0,
      ),
    [grouped],
  );

  const [tab, setTab] = useState<GuideTabId>(availableTabs[0] || "overview");
  const active = availableTabs.includes(tab) ? tab : availableTabs[0] || "overview";

  return (
    <div className="space-y-4">
      <nav
        className="sticky top-[4.25rem] z-20 -mx-1 overflow-x-auto px-1 py-1.5 scrollbar-thin"
        aria-label="Разделы гайда"
      >
        <div className="inline-flex min-w-full gap-1 rounded-[18px] border border-[#0b1f44]/25 bg-[#0b1f44] p-1.5 shadow-[0_12px_28px_-12px_rgba(11,31,68,0.55)] sm:min-w-0 sm:flex">
          {availableTabs.map((id) => {
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`shrink-0 rounded-[12px] px-3.5 py-2.5 text-[13px] transition sm:flex-1 ${
                  on
                    ? "bg-[#189b8e] font-semibold text-white shadow-md"
                    : "font-medium text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {GUIDE_TAB_LABELS[id]}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="space-y-3.5">
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
