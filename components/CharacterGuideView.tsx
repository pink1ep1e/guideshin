"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
import {
  ELEMENT_SVG,
  ELEMENT_THEME,
  getElementTheme,
  rarityBg,
  type ElementKey,
} from "@/lib/genshin";
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
  Цветок: "/images/artifact-slots/flower.png",
  Перо: "/images/artifact-slots/plume.png",
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
      className="guide-html guide-md"
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
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1"
            style={{
              backgroundColor: theme.soft,
              color: theme.accent,
              borderColor: theme.solid,
              boxShadow: `inset 0 0 0 1px ${theme.solid}33`,
            }}
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
    <section className="overflow-hidden rounded-[20px] bg-white/95 shadow-panel ring-1 ring-black/[0.04]">
      <div className="border-b border-black/[0.04] px-4 py-4 sm:px-5">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--el-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-genshin text-[1.3rem] tracking-wide text-foreground sm:text-[1.45rem]">
          {title}
        </h2>
        {intro ? (
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
            {intro}
          </p>
        ) : null}
        {pills?.length ? <ElementPills keys={pills} /> : null}
      </div>
      <div className="px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  );
}

function MemberPortrait({ m, role }: { m: GuideTeamMember; role?: string }) {
  const bg = m.rarity === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg";
  const body = (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <div
        className="relative h-[76px] w-[76px] overflow-hidden rounded-[16px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.06] sm:h-[88px] sm:w-[88px]"
        style={{ backgroundImage: `url(${bg})` }}
      >
        {m.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.image} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <span className="flex h-full items-center justify-center text-sm font-semibold text-muted-foreground">
            {m.name.slice(0, 1)}
          </span>
        )}
        {m.elementIcon ? (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/[0.06]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.elementIcon} alt="" className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 w-full px-0.5">
        {role ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--el-accent)]">
            {role}
          </p>
        ) : null}
        <p className="truncate font-genshin text-[13px] tracking-wide text-foreground sm:text-[14px]">
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

function TeamVariantCard({ v }: { v: GuideTeamVariant }) {
  const roles = ["Мейн-дд", "Саппорт", "Саб-дд", "Флекс"];
  return (
    <article className="overflow-hidden rounded-[18px] bg-white shadow-panel ring-1 ring-black/[0.05]">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.04] px-3.5 py-2.5">
        {v.badge ? (
          <span className="rounded-md bg-[var(--el-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--el-accent)]">
            {v.badge}
          </span>
        ) : null}
        <span className="text-[12px] text-muted-foreground">
          {v.members.map((m) => m.name).join(" · ")}
        </span>
      </div>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-2.5 sm:p-3.5">
          {v.members.map((m, i) => (
            <div
              key={m.id}
              className="rounded-[14px] bg-[var(--el-soft)]/40 px-2 py-2.5 ring-1 ring-black/[0.03]"
            >
              <MemberPortrait m={m} role={(m.role && m.role.trim()) || roles[i]} />
            </div>
          ))}
        </div>
        <div className="border-t border-black/[0.04] bg-[#f6f8fa] px-3.5 py-3.5 sm:border-l sm:border-t-0 sm:px-4">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--el-accent)]">
            Особенности
          </p>
          <p className="text-[13.5px] leading-relaxed text-foreground/85">{v.features}</p>
        </div>
      </div>
    </article>
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

  const iconBox = (item: GuideRankedItem, large?: boolean) => (
    <div
      className={`shrink-0 overflow-hidden rounded-[14px] bg-cover bg-center ring-1 ring-black/[0.06] ${
        large ? "h-[84px] w-[84px] sm:h-[96px] sm:w-[96px]" : "h-[64px] w-[64px]"
      }`}
      style={{ backgroundImage: `url(${rarityBg(item.rarity >= 5 ? 5 : 4)})` }}
    >
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
      ) : null}
    </div>
  );

  return (
    <div className="space-y-2.5">
      <article className="rounded-[18px] bg-[var(--el-soft)]/50 p-4 ring-1 ring-[var(--el-solid)]/25 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[var(--el-solid)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--el-on-solid)]">
            Топ-выбор
          </span>
          <span className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[var(--el-accent)] ring-1 ring-black/[0.04]">
            {tierForRank(top.rank, top.tier)}
          </span>
          {top.subtitle ? (
            <span className="text-[12px] text-muted-foreground">{top.subtitle}</span>
          ) : null}
        </div>
        <div className="flex gap-3.5">
          {top.href ? (
            <Link href={top.href} className="shrink-0">
              {iconBox(top, true)}
            </Link>
          ) : (
            iconBox(top, true)
          )}
          <div className="min-w-0 flex-1">
            {top.href ? (
              <Link
                href={top.href}
                className="font-genshin text-[1.05rem] tracking-wide text-foreground hover:text-[var(--el-accent)]"
              >
                {top.name}
              </Link>
            ) : (
              <p className="font-genshin text-[1.05rem] tracking-wide">{top.name}</p>
            )}
            {top.effect ? (
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {top.effect}
              </p>
            ) : null}
            {top.verdict ? (
              <p className="mt-2 rounded-[12px] bg-white/90 px-3 py-2 text-[13px] leading-snug text-[var(--el-accent)] ring-1 ring-black/[0.04]">
                <span className="font-semibold">Когда брать: </span>
                {top.verdict}
              </p>
            ) : null}
          </div>
        </div>
      </article>

      {rest.map((item) => (
        <article
          key={item.id}
          className="rounded-[14px] bg-[#f7f9fb] p-3 ring-1 ring-black/[0.04] sm:p-3.5"
        >
          <div className="flex gap-3">
            {item.href ? (
              <Link href={item.href} className="shrink-0">
                {iconBox(item)}
              </Link>
            ) : (
              iconBox(item)
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                  #{item.rank}
                </span>
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[var(--el-accent)] ring-1 ring-black/[0.04]">
                  {tierForRank(item.rank, item.tier)}
                </span>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="font-genshin text-[14px] tracking-wide hover:text-[var(--el-accent)]"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="font-genshin text-[14px] tracking-wide">{item.name}</span>
                )}
              </div>
              {item.effect ? (
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {item.effect}
                </p>
              ) : null}
              {item.verdict ? (
                <p className="mt-1.5 border-l-2 border-[var(--el-solid)]/40 pl-2 text-[12.5px] leading-snug text-[var(--el-accent)]">
                  {item.verdict}
                </p>
              ) : null}
            </div>
          </div>
        </article>
      ))}
      <p className="text-[11px] text-muted-foreground">
        {kind === "weapons"
          ? "Приоритет сверху вниз. Ниже — ситуативные и бюджетные варианты."
          : "Сначала полный топ-сет, затем ситуативные и временные 2+2."}
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
          <div className="rounded-[14px] border-l-[3px] border-l-[var(--el-solid)] bg-[#f8fafb] p-4 ring-1 ring-black/[0.04]">
            <h3 className="mb-2.5 text-[13px] font-semibold text-[var(--el-accent)]">
              {block.prosTitle || "Преимущества"}
            </h3>
            <ul className="list-disc space-y-2 pl-4 text-[13.5px] leading-relaxed text-muted-foreground">
              {block.pros.filter(Boolean).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] border-l-[3px] border-l-[#c45c5c] bg-[#f8fafb] p-4 ring-1 ring-black/[0.04]">
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
              className="rounded-[14px] bg-[#f7f9fb] px-3.5 py-3 ring-1 ring-black/[0.04]"
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
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Основные статы по слотам
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {block.slots.map((s) => {
                const icon = SLOT_ICONS[s.slot] || SLOT_ICONS["Цветок"];
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-[14px] bg-[#f7f9fb] px-2.5 py-2 ring-1 ring-black/[0.04]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={icon}
                      alt=""
                      className="h-12 w-12 shrink-0 object-contain"
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-foreground">{s.slot}</p>
                      <p className="text-[13px] font-semibold text-[var(--el-accent)]">
                        {s.main}
                      </p>
                      <p className="truncate text-[11.5px] text-muted-foreground" title={s.subs}>
                        {s.subs}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </SectionChrome>
    );
  }

  if (block.type === "rankedList") {
    return (
      <SectionChrome eyebrow={block.eyebrow} title={block.title} intro={block.intro}>
        <RankedGear items={block.items} kind={block.kind} />
      </SectionChrome>
    );
  }

  if (block.type === "setPlan") {
    return (
      <SectionChrome
        eyebrow={block.eyebrow}
        title={block.title}
        intro={block.intro}
        pills={elementsMentioned(`${block.title}\n${block.intro}`)}
      >
        <div className="space-y-5">
          {block.groups.map((g) => (
            <div key={g.id}>
              <h3 className="mb-2.5 font-display text-[15px] font-semibold text-foreground">
                {g.title}
              </h3>
              <div className="space-y-2">
                {g.rows.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-[14px] bg-[#f7f9fb] px-2.5 py-2 ring-1 ring-black/[0.04]"
                  >
                    {r.href ? (
                      <Link href={r.href} className="flex min-w-0 items-center gap-2.5">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-cover bg-center ring-1 ring-black/[0.05]"
                          style={{ backgroundImage: "url(/images/legend-bg.jpg)" }}
                        >
                          {r.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image} alt="" className="h-full w-full object-cover object-top" />
                          ) : null}
                        </div>
                        <span className="truncate font-genshin text-[13.5px] tracking-wide text-[var(--el-accent)]">
                          {r.name}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[12px] bg-[#eee]">
                          {r.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.image} alt="" className="h-full w-full object-cover object-top" />
                          ) : null}
                        </div>
                        <span className="truncate font-genshin text-[13.5px]">{r.name}</span>
                      </div>
                    )}
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-right text-[12.5px] text-muted-foreground">
                        {r.setName}
                      </span>
                      {r.setImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.setImage}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-[10px] object-contain ring-1 ring-black/[0.05]"
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
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
      <article className="overflow-hidden rounded-[18px] bg-white shadow-panel ring-1 ring-black/[0.05]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] px-3.5 py-2.5">
          <h3 className="font-display text-[15px] font-semibold">{block.title}</h3>
          {block.badge ? (
            <span className="rounded-md bg-[var(--el-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--el-accent)]">
              {block.badge}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
          {block.members.map((m, i) => (
            <div
              key={m.id}
              className="rounded-[14px] bg-[var(--el-soft)]/40 px-2 py-2.5"
            >
              <MemberPortrait m={m} role={(m.role && m.role.trim()) || roles[i]} />
            </div>
          ))}
        </div>
        {block.note ? (
          <p className="border-t border-black/[0.04] bg-[#f6f8fa] px-3.5 py-3 text-[13.5px] leading-relaxed text-foreground/85">
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
              className="flex gap-3 rounded-[14px] bg-[#f7f9fb] p-3 ring-1 ring-black/[0.04]"
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
                      className="font-genshin text-[14px] tracking-wide text-[var(--el-accent)] hover:underline"
                    >
                      {r.name}
                    </Link>
                  ) : (
                    <span className="font-genshin text-[14px]">{r.name}</span>
                  )}
                  {r.elementIcon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.elementIcon} alt="" className="h-4 w-4" />
                  ) : null}
                  <span className="rounded-md bg-white px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-black/[0.04]">
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
        <div className="space-y-2">
          {block.rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-[14px] bg-[#f7f9fb] px-2.5 py-2 ring-1 ring-black/[0.04]"
            >
              {r.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.image} alt="" className="h-11 w-11 object-contain" />
              ) : null}
              <div className="min-w-0 flex-1">
                {r.href ? (
                  <Link href={r.href} className="font-medium text-[var(--el-accent)] hover:underline">
                    {r.name}
                  </Link>
                ) : (
                  <span className="font-medium">{r.name}</span>
                )}
                <p className="text-[12px] text-muted-foreground">{r.where}</p>
              </div>
              {r.qty ? (
                <span className="shrink-0 rounded-md bg-[var(--el-soft)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--el-accent)]">
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
                  <td className="px-2 py-2 font-medium text-[var(--el-accent)]">{r.ascStat}</td>
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
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
          {block.items.map((item) => {
            const stars = item.rarity >= 5 ? 5 : 4;
            const card = (
              <div className="overflow-hidden rounded-[16px] bg-card shadow-panel ring-1 ring-black/[0.06]">
                <div
                  className="relative aspect-square bg-cover bg-center"
                  style={{ backgroundImage: `url(${rarityBg(stars)})` }}
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="h-full w-full object-contain p-1"
                    />
                  ) : null}
                  {item.qty ? (
                    <span className="absolute bottom-1.5 right-1.5 rounded-full bg-[var(--el-solid)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--el-on-solid)]">
                      ×{item.qty}
                    </span>
                  ) : null}
                </div>
                <p className="font-genshin line-clamp-2 min-h-[2.4rem] px-1.5 py-1.5 text-center text-[11px] leading-snug">
                  {item.name}
                </p>
              </div>
            );
            return item.href ? (
              <Link key={item.id} href={item.href} className="transition hover:opacity-95">
                {card}
              </Link>
            ) : (
              <div key={item.id}>{card}</div>
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
  element,
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
  const theme = getElementTheme(element);
  const themeVars = {
    "--el-solid": theme.solid,
    "--el-hover": theme.hover,
    "--el-soft": theme.soft,
    "--el-soft-hover": theme.softHover,
    "--el-accent": theme.accent,
    "--el-on-solid": theme.onSolid,
    "--el-glow": theme.glow,
  } as CSSProperties;

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
    <div className="space-y-4" style={themeVars}>
      <div className="sticky top-[4.25rem] z-30 -mx-1 px-1">
        <nav
          className="rounded-[16px] bg-white/95 p-1 shadow-panel ring-1 ring-black/[0.06] backdrop-blur-md"
          aria-label="Разделы гайда"
          style={{
            boxShadow: `0 10px 28px -16px ${theme.glow}`,
          }}
        >
          <div className="flex gap-1 overflow-x-auto scrollbar-thin">
            {availableTabs.map((id) => {
              const on = id === active;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`shrink-0 rounded-[12px] px-3.5 py-2.5 text-[13px] transition sm:flex-1 ${
                    on
                      ? "font-semibold text-[var(--el-on-solid)] shadow-sm"
                      : "font-medium text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
                  }`}
                  style={on ? { backgroundColor: theme.solid } : undefined}
                >
                  {GUIDE_TAB_LABELS[id]}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

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
