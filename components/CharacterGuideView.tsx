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
import { rarityBg } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

const TAB_ORDER: GuideTabId[] = [
  "overview",
  "build",
  "gear",
  "teams",
  "leveling",
  "play",
];

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
    <div className="guide-md" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function SectionChrome({
  eyebrow,
  title,
  intro,
  children,
  accent = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-[18px] border p-4 sm:p-5 ${
        accent
          ? "border-[#189b8e]/25 bg-gradient-to-br from-[#189b8e]/[0.06] via-white to-white"
          : "border-black/[0.045] bg-white"
      }`}
    >
      {eyebrow ? (
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#189b8e]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-genshin text-[1.25rem] tracking-wide text-foreground sm:text-[1.4rem]">
        {title}
      </h2>
      {intro ? (
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
          {intro}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MemberChip({ m, role }: { m: GuideTeamMember; role?: string }) {
  const bg = m.rarity === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg";
  const inner = (
    <div className="flex min-w-0 items-center gap-2">
      <div
        className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cover bg-center ring-1 ring-black/[0.06]"
        style={{ backgroundImage: `url(${bg})` }}
      >
        {m.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.image} alt="" className="h-full w-full object-cover" />
        ) : null}
        {m.elementIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.elementIcon}
            alt=""
            className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 drop-shadow"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        {role ? (
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            {role}
          </p>
        ) : null}
        <p className="truncate text-[12.5px] font-medium text-foreground">{m.name}</p>
      </div>
    </div>
  );
  return m.href ? (
    <Link href={m.href} className="transition hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
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
    <article className="overflow-hidden rounded-[16px] border border-black/[0.05] bg-white">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="p-3.5 sm:p-4">
          {v.badge ? (
            <span className="mb-2.5 inline-block rounded-md bg-[#189b8e]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#189b8e]">
              {v.badge}
            </span>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            {v.members.map((m, i) => (
              <MemberChip
                key={m.id}
                m={m}
                role={(m.role && m.role.trim()) || roles[i]}
              />
            ))}
          </div>
        </div>
        <div className="border-t border-black/[0.04] bg-[#f4f7f8] px-3.5 py-3 sm:border-l sm:border-t-0 sm:px-4 sm:py-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Особенности
          </p>
          <p className="text-[13px] leading-relaxed text-foreground/85">{v.features}</p>
        </div>
      </div>
    </article>
  );
}

function BlockView({ block }: { block: GuideBlock }) {
  if (block.type === "text") {
    const html = renderLiteMarkdown(block.body);
    if (!html && !block.title) return null;
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title || "Раздел"}>
        <Md html={html} />
      </SectionChrome>
    );
  }

  if (block.type === "prosCons") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title}>
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
      <SectionChrome eyebrow={block.eyebrow} title={block.title} intro={block.intro}>
        <div className="space-y-2.5">
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
      <article className="overflow-hidden rounded-[16px] border border-black/[0.05] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] bg-[#f7f9fb] px-3.5 py-2.5">
          <h3 className="font-display text-[15px] font-semibold">{block.title}</h3>
          {block.badge ? (
            <span className="rounded-md bg-[#189b8e]/10 px-2 py-0.5 text-[11px] font-semibold text-[#189b8e]">
              {block.badge}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 p-3.5 sm:grid-cols-4">
          {block.members.map((m, i) => (
            <MemberChip
              key={m.id}
              m={m}
              role={(m.role && m.role.trim()) || roles[i]}
            />
          ))}
        </div>
        {block.note ? (
          <p className="border-t border-black/[0.04] bg-[#f7f9fb] px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
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
              className="flex gap-3 rounded-[14px] border border-black/[0.04] bg-[#f8fafb] p-3"
            >
              <div
                className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cover bg-center ring-1 ring-black/[0.05]"
                style={{ backgroundImage: "url(/images/legend-bg.jpg)" }}
              >
                {r.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {r.href ? (
                    <Link
                      href={r.href}
                      className="font-medium text-[#189b8e] hover:underline"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{r.name}</span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {r.element} · {r.weapon}
                  </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
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
        className="sticky top-[4.5rem] z-20 -mx-1 overflow-x-auto px-1 py-1 scrollbar-thin"
        aria-label="Разделы гайда"
      >
        <div className="inline-flex min-w-full gap-1 rounded-[16px] border border-black/[0.06] bg-white/95 p-1 shadow-soft backdrop-blur-md sm:min-w-0 sm:flex">
          {availableTabs.map((id) => {
            const on = id === active;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`shrink-0 rounded-[12px] px-3.5 py-2 text-[13px] transition sm:flex-1 ${
                  on
                    ? "bg-[#0b1f44] font-semibold text-white shadow-sm"
                    : "font-medium text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
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
