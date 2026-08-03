import { rarityBg } from "@/lib/genshin";

export type GuideItem = {
  id: string;
  name: string;
  image: string;
  rarity: 4 | 5;
  note: string;
  /** Where to find / quantity (for resource tables) */
  source?: string;
  /** Quantity for material cards (hidden when 0 / empty) */
  qty?: string;
  /** Public wiki link, e.g. /wiki/weapons/mistsplitter */
  href?: string;
};

export type GuideTeamMember = {
  id: string;
  name: string;
  image: string;
  elementIcon: string;
  rarity: 4 | 5;
  href?: string;
  /** Роль в отряде (мейн-дд, саппорт…) */
  role?: string;
};

export type GuideRankedItem = {
  id: string;
  rank: number;
  name: string;
  image: string;
  rarity: 4 | 5;
  href?: string;
  subtitle: string;
  effect: string;
  verdict: string;
};

export type GuideStatTarget = {
  id: string;
  label: string;
  value: string;
  hint?: string;
};

export type GuideArtifactSlot = {
  id: string;
  slot: string;
  main: string;
  subs: string;
};

export type GuideRoleRow = {
  id: string;
  name: string;
  image: string;
  element: string;
  elementIcon: string;
  weapon: string;
  weaponIcon: string;
  description: string;
  href?: string;
};

export type GuideStatsRow = {
  id: string;
  level: string;
  hp: string;
  atk: string;
  def: string;
  baseStat: string;
  ascStat: string;
};

export type GuideResourceRow = {
  id: string;
  name: string;
  image: string;
  qty: string;
  where: string;
  href?: string;
};

export type GuideBlock =
  | { id: string; type: "text"; eyebrow: string; title: string; body: string }
  | { id: string; type: "video"; title: string; youtubeUrl: string; videoUrl: string }
  | { id: string; type: "weapons"; title: string; items: GuideItem[] }
  | { id: string; type: "artifacts"; title: string; items: GuideItem[] }
  | { id: string; type: "materials"; title: string; items: GuideItem[] }
  | {
      id: string;
      type: "team";
      title: string;
      badge: string;
      note: string;
      members: GuideTeamMember[];
    }
  | {
      id: string;
      type: "roleTable";
      eyebrow: string;
      title: string;
      intro: string;
      rows: GuideRoleRow[];
    }
  | {
      id: string;
      type: "statsTable";
      title: string;
      intro: string;
      colLabels: [string, string, string, string, string, string];
      rows: GuideStatsRow[];
    }
  | {
      id: string;
      type: "resourceTable";
      title: string;
      intro: string;
      rows: GuideResourceRow[];
    }
  | {
      id: string;
      type: "prosCons";
      eyebrow: string;
      title: string;
      prosTitle: string;
      consTitle: string;
      pros: string[];
      cons: string[];
    }
  | {
      id: string;
      type: "statTargets";
      eyebrow: string;
      title: string;
      intro: string;
      targets: GuideStatTarget[];
      slots: GuideArtifactSlot[];
    }
  | {
      id: string;
      type: "rankedList";
      eyebrow: string;
      title: string;
      intro: string;
      kind: "weapons" | "artifacts";
      items: GuideRankedItem[];
    };

const MARKER_START = "<!--genshin-guide-blocks:";
const MARKER_END = "-->";

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyBlocks(name = "Персонаж"): GuideBlock[] {
  return [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "О персонаже",
      body: `Краткий гайд на ${name}: роли, сильные стороны и приоритет прокачки.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Саб-дд",
      title: "Карманные дамагеры",
      intro: "Персонажи, которые наносят урон из кармана и усиливают основной DPS.",
      rows: [],
    },
    {
      id: uid(),
      type: "video",
      title: "Видео-гайд",
      youtubeUrl: "",
      videoUrl: "",
    },
    {
      id: uid(),
      type: "weapons",
      title: "Рекомендуемое оружие",
      items: [],
    },
    {
      id: uid(),
      type: "artifacts",
      title: "Артефакты",
      items: [],
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Характеристики: что повышается при возвышении",
      intro:
        "Базовые HP, сила атаки и защита растут с уровнем. Дополнительная характеристика от возвышения указана в последнем столбце.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый крит. шанс",
        "Крит. шанс с возвышения",
      ],
      rows: [
        emptyStatsRow("1", "1192", "19", "54", "5%", "0%"),
        emptyStatsRow("20", "3092", "50", "140", "5%", "0%"),
        emptyStatsRow("40", "6127", "98", "278", "5%", "4.8%"),
        emptyStatsRow("50", "7896", "127", "359", "5%", "9.6%"),
        emptyStatsRow("60", "9925", "159", "451", "5%", "9.6%"),
        emptyStatsRow("70", "11724", "188", "532", "5%", "14.4%"),
        emptyStatsRow("80", "13532", "217", "615", "5%", "19.2%"),
        emptyStatsRow("90", "15307", "244", "696", "5%", "24.2%"),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Для повышения уровней персонажа нужны следующие ресурсы:",
      rows: [],
    },
    {
      id: uid(),
      type: "materials",
      title: "Материалы и расходники",
      items: [],
    },
    {
      id: uid(),
      type: "team",
      title: "Премиум-отряд",
      badge: "Топ",
      note: "Ротация: ульты саппортов → баффы → ульта DPS.",
      members: [],
    },
  ];
}

export function emptyRoleRow(): GuideRoleRow {
  return {
    id: uid(),
    name: "",
    image: "",
    element: "Гидро",
    elementIcon: "/images/elements/Element_Hydro.svg",
    weapon: "Лук",
    weaponIcon: "",
    description: "",
  };
}

export function emptyStatsRow(
  level = "",
  hp = "",
  atk = "",
  def = "",
  baseStat = "",
  ascStat = "",
): GuideStatsRow {
  return { id: uid(), level, hp, atk, def, baseStat, ascStat };
}

export function emptyResourceRow(): GuideResourceRow {
  return { id: uid(), name: "", image: "", qty: "", where: "", href: "" };
}

export function emptyRankedItem(rank = 1): GuideRankedItem {
  return {
    id: uid(),
    rank,
    name: "",
    image: "",
    rarity: 5,
    href: "",
    subtitle: "",
    effect: "",
    verdict: "",
  };
}

export function emptyStatTarget(): GuideStatTarget {
  return { id: uid(), label: "", value: "", hint: "" };
}

export function emptyArtifactSlot(slot = ""): GuideArtifactSlot {
  return { id: uid(), slot, main: "", subs: "" };
}

export function emptyProsConsBlock(): Extract<GuideBlock, { type: "prosCons" }> {
  return {
    id: uid(),
    type: "prosCons",
    eyebrow: "Анализ",
    title: "Плюсы и минусы",
    prosTitle: "Преимущества",
    consTitle: "Недостатки",
    pros: [""],
    cons: [""],
  };
}

export function emptyStatTargetsBlock(): Extract<GuideBlock, { type: "statTargets" }> {
  return {
    id: uid(),
    type: "statTargets",
    eyebrow: "Билд",
    title: "Рекомендуемые характеристики",
    intro: "",
    targets: [emptyStatTarget()],
    slots: [
      emptyArtifactSlot("Цветок"),
      emptyArtifactSlot("Перо"),
      emptyArtifactSlot("Пески"),
      emptyArtifactSlot("Кубок"),
      emptyArtifactSlot("Корона"),
    ],
  };
}

export function emptyRankedListBlock(
  kind: "weapons" | "artifacts" = "weapons",
): Extract<GuideBlock, { type: "rankedList" }> {
  return {
    id: uid(),
    type: "rankedList",
    eyebrow: kind === "weapons" ? "Оружие" : "Артефакты",
    title: kind === "weapons" ? "Рейтинг оружия" : "Рейтинг артефактов",
    intro: "",
    kind,
    items: [emptyRankedItem(1)],
  };
}

export function youtubeEmbedUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = url.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Простой markdown-lite: абзацы, списки, **bold**, ### заголовки */
export function renderLiteMarkdown(raw: string): string {
  const src = raw.replace(/\r\n/g, "\n").trim();
  if (!src) return "";

  const inline = (s: string) =>
    escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const blocks = src.split(/\n{2,}/);
  const out: string[] = [];
  const bulletRe = /^[-•*]\s+/;

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    const isList = lines.every((l) => !l.trim() || bulletRe.test(l.trim()));
    if (isList && lines.some((l) => bulletRe.test(l.trim()))) {
      const items = lines
        .filter((l) => bulletRe.test(l.trim()))
        .map((l) => `<li>${inline(l.trim().replace(bulletRe, ""))}</li>`)
        .join("");
      out.push(`<ul class="guide-md-list">${items}</ul>`);
      continue;
    }

    const htmlLines: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith("### ")) {
        htmlLines.push(`<h3 class="guide-md-h3">${inline(t.slice(4))}</h3>`);
      } else if (t.startsWith("## ")) {
        htmlLines.push(`<h3 class="guide-md-h3">${inline(t.slice(3))}</h3>`);
      } else {
        htmlLines.push(`<p class="guide-md-p">${inline(t)}</p>`);
      }
    }
    out.push(htmlLines.join("\n"));
  }

  return out.join("\n");
}

function visibleQty(qty?: string | number | null): string | null {
  if (qty === undefined || qty === null || qty === "") return null;
  const raw = String(qty).trim().replace(/^×/, "");
  if (!raw || raw === "0") return null;
  const n = Number(raw.replace(/\s/g, ""));
  if (Number.isFinite(n) && n === 0) return null;
  if (Number.isFinite(n)) return n.toLocaleString("ru-RU");
  return raw;
}

function itemCardHtml(item: GuideItem) {
  const stars = item.rarity >= 5 ? 5 : item.rarity >= 4 ? 4 : item.rarity;
  const bg = rarityBg(stars);
  const qtyLabel = visibleQty(item.qty);
  const noteText = item.note?.trim() && !qtyLabel ? item.note.trim() : null;
  const qtyHtml = qtyLabel
    ? `<span class="shrink-0 text-[12px] font-semibold tabular-nums text-[#189b8e]">×${escapeHtml(qtyLabel)}</span>`
    : noteText
      ? `<span class="shrink-0 text-[11px] text-[#189b8e]">${escapeHtml(noteText)}</span>`
      : "";
  const icon = `<div class="h-10 w-10 shrink-0 overflow-hidden rounded-[9px] bg-cover bg-center ring-1 ring-black/[0.05]" style="background-image:url(${bg})">
    ${item.image ? `<img src="${escapeHtml(item.image)}" alt="" class="h-full w-full object-contain p-0.5" />` : ""}
  </div>`;
  const body = `${icon}
  <span class="min-w-0 flex-1 truncate text-[12.5px] leading-snug text-foreground" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
  ${qtyHtml}`;
  if (item.href) {
    return `<a href="${escapeHtml(item.href)}" title="${escapeHtml(item.name)}" class="guide-item-link flex min-w-0 items-center gap-2 rounded-[12px] border border-black/[0.04] bg-[#f7f9fb] px-2 py-1.5 transition hover:border-black/[0.08] hover:bg-white">${body}</a>`;
  }
  return `<div class="flex min-w-0 items-center gap-2 rounded-[12px] border border-black/[0.04] bg-[#f7f9fb] px-2 py-1.5" title="${escapeHtml(item.name)}">${body}</div>`;
}

function sectionHead(eyebrow: string, title: string, intro?: string) {
  return `<div class="mb-4">
  ${eyebrow ? `<p class="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#189b8e]">${escapeHtml(eyebrow)}</p>` : ""}
  <h2 class="font-genshin text-[1.35rem] leading-tight tracking-wide text-foreground sm:text-[1.5rem]">${escapeHtml(title)}</h2>
  ${intro ? `<p class="mt-2 text-[14px] leading-relaxed text-muted-foreground">${escapeHtml(intro)}</p>` : ""}
</div>`;
}

function rankedItemHtml(item: GuideRankedItem) {
  const stars = item.rarity >= 5 ? 5 : 4;
  const bg = rarityBg(stars);
  const iconInner = item.image
    ? `<img src="${escapeHtml(item.image)}" alt="" class="h-full w-full object-contain" />`
    : `<span class="px-1 text-center text-[10px] font-medium text-muted-foreground">Нет иконки</span>`;
  const icon = `<div class="guide-rank-icon shrink-0 overflow-hidden rounded-[14px] bg-cover bg-center ring-1 ring-black/[0.06]" style="background-image:url(${bg})">${iconInner}</div>`;
  const titleRow = item.href
    ? `<a href="${escapeHtml(item.href)}" class="guide-item-link font-genshin text-[14px] tracking-wide text-foreground hover:text-[#189b8e]">${escapeHtml(item.name)}</a>`
    : `<span class="font-genshin text-[14px] tracking-wide text-foreground">${escapeHtml(item.name)}</span>`;

  return `<article class="guide-rank-card">
  <div class="guide-rank-badge" aria-hidden="true">${escapeHtml(String(item.rank))}</div>
  <div class="guide-rank-body">
    ${item.href ? `<a href="${escapeHtml(item.href)}" class="guide-item-link shrink-0 transition hover:opacity-90">${icon}</a>` : icon}
    <div class="min-w-0 flex-1">
      <div class="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        ${titleRow}
        ${item.subtitle ? `<span class="text-[11.5px] text-muted-foreground/90">${escapeHtml(item.subtitle)}</span>` : ""}
      </div>
      ${item.effect ? `<p class="guide-rank-effect">${escapeHtml(item.effect)}</p>` : ""}
      ${item.verdict ? `<p class="guide-rank-verdict">${escapeHtml(item.verdict)}</p>` : ""}
    </div>
  </div>
</article>`;
}

export type GuideNavItem = { id: string; label: string };

export function guideSectionId(index: number) {
  return `guide-sec-${index}`;
}

export function navLabelForBlock(block: GuideBlock): string | null {
  switch (block.type) {
    case "text": {
      const t = block.title || block.eyebrow || "Раздел";
      if (t.length <= 24) return t;
      return block.eyebrow && block.eyebrow.length <= 24 ? block.eyebrow : `${t.slice(0, 20)}…`;
    }
    case "prosCons":
      return "Плюсы и минусы";
    case "statTargets":
      return "Билд";
    case "rankedList":
      return block.kind === "weapons" ? "Оружие" : "Артефакты";
    case "weapons":
      return "Оружие";
    case "artifacts":
      return "Артефакты";
    case "materials":
      return "Таланты";
    case "team":
      return null;
    case "roleTable":
      return "Союзники";
    case "statsTable":
      return "Характеристики";
    case "resourceTable":
      return "Прокачка";
    case "video":
      return "Видео";
    default:
      return null;
  }
}

export function buildGuideNavItems(blocks: GuideBlock[]): GuideNavItem[] {
  const items: GuideNavItem[] = [];
  const seen = new Set<string>();
  let teamsAdded = false;

  blocks.forEach((block, index) => {
    if (block.type === "team") {
      if (teamsAdded) return;
      teamsAdded = true;
      items.push({ id: guideSectionId(index), label: "Отряды" });
      seen.add("Отряды");
      return;
    }
    const label = navLabelForBlock(block);
    if (!label || seen.has(label)) return;
    if (block.type === "video" && !block.youtubeUrl && !block.videoUrl) return;
    if (
      (block.type === "weapons" ||
        block.type === "artifacts" ||
        block.type === "materials") &&
      block.items.length === 0
    )
      return;
    if (block.type === "roleTable" && block.rows.length === 0) return;
    if (block.type === "rankedList" && block.items.length === 0) return;
    seen.add(label);
    items.push({ id: guideSectionId(index), label });
  });

  return items;
}

function wrapSection(index: number, html: string) {
  if (!html) return "";
  return html
    .replace(
      /^<div class="guide-section"/,
      `<div id="${guideSectionId(index)}" class="guide-section scroll-mt-28"`,
    )
    .replace(
      /^<div class="guide-team"/,
      `<div id="${guideSectionId(index)}" class="guide-team scroll-mt-28"`,
    );
}

function renderBlock(block: GuideBlock, index = 0): string {
  if (block.type === "text") {
    const body = renderLiteMarkdown(block.body);
    if (!body && !block.title) return "";
    return wrapSection(
      index,
      `<div class="guide-section">
  ${sectionHead(block.eyebrow || "Раздел", block.title, undefined)}
  <div class="guide-md">${body}</div>
</div>`,
    );
  }

  if (block.type === "prosCons") {
    const pros = block.pros.filter((p) => p.trim());
    const cons = block.cons.filter((c) => c.trim());
    if (!pros.length && !cons.length) return "";
    return `<div class="guide-section">
  ${sectionHead(block.eyebrow || "Анализ", block.title)}
  <div class="guide-proscons">
    <div class="guide-pros">
      <h3 class="guide-proscons-title guide-proscons-title--pro">${escapeHtml(block.prosTitle || "Преимущества")}</h3>
      <ul class="guide-proscons-list">${pros.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}</ul>
    </div>
    <div class="guide-cons">
      <h3 class="guide-proscons-title guide-proscons-title--con">${escapeHtml(block.consTitle || "Недостатки")}</h3>
      <ul class="guide-proscons-list">${cons.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
    </div>
  </div>
</div>`;
  }

  if (block.type === "statTargets") {
    const targets = block.targets.filter((t) => t.label.trim() || t.value.trim());
    const slots = block.slots.filter((s) => s.slot.trim() || s.main.trim());
    if (!targets.length && !slots.length) return "";
    return `<div class="guide-section">
  ${sectionHead(block.eyebrow || "Билд", block.title, block.intro)}
  ${
    targets.length
      ? `<div class="guide-stat-targets">${targets
          .map(
            (t) => `<div class="guide-stat-chip">
    <p class="guide-stat-chip-label">${escapeHtml(t.label)}</p>
    <p class="guide-stat-chip-value">${escapeHtml(t.value)}</p>
    ${t.hint ? `<p class="guide-stat-chip-hint">${escapeHtml(t.hint)}</p>` : ""}
  </div>`,
          )
          .join("")}</div>`
      : ""
  }
  ${
    slots.length
      ? `<div class="guide-table-wrap mt-4">
    <table class="guide-table">
      <thead><tr><th>Слот</th><th>Основная характеристика</th><th>Саб-статы</th></tr></thead>
      <tbody>
        ${slots
          .map(
            (s) => `<tr>
          <td class="guide-td-center font-bold text-foreground">${escapeHtml(s.slot)}</td>
          <td class="guide-td-center">${escapeHtml(s.main)}</td>
          <td class="guide-td-desc">${escapeHtml(s.subs)}</td>
        </tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }
</div>`;
  }

  if (block.type === "rankedList") {
    if (!block.items.length) return "";
    const sorted = [...block.items].sort((a, b) => a.rank - b.rank);
    return `<div class="guide-section">
  ${sectionHead(block.eyebrow || (block.kind === "weapons" ? "Оружие" : "Артефакты"), block.title, block.intro)}
  <div class="guide-rank-list">
    ${sorted.map(rankedItemHtml).join("\n    ")}
  </div>
</div>`;
  }

  if (block.type === "video") {
    const yt = youtubeEmbedUrl(block.youtubeUrl);
    if (!yt && !block.videoUrl) return "";
    return `<div class="guide-section">
  ${sectionHead("Медиа", block.title || "Видео")}
  <div class="overflow-hidden rounded-[20px] border border-black/[0.05] bg-black/5 shadow-soft">
    ${
      yt
        ? `<div class="guide-video"><iframe src="${yt}" title="${escapeHtml(block.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`
        : `<video class="w-full rounded-[20px]" controls preload="metadata" src="${escapeHtml(block.videoUrl)}"></video>`
    }
  </div>
</div>`;
  }

  if (block.type === "weapons" || block.type === "artifacts" || block.type === "materials") {
    if (block.items.length === 0) return "";
    const eyebrow =
      block.type === "weapons" ? "Оружие" : block.type === "artifacts" ? "Артефакты" : "Материалы";
    return `<div class="guide-section">
  ${sectionHead(eyebrow, block.title)}
  <div class="grid gap-1.5 sm:grid-cols-2">
    ${block.items.map(itemCardHtml).join("\n    ")}
  </div>
</div>`;
  }

  if (block.type === "team") {
    if (block.members.length === 0) return "";
    const defaultRoles = ["Мейн-дд", "Саппорт", "Саб-дд", "Флекс"];
    return `<div class="guide-team overflow-hidden rounded-[16px] border border-black/[0.05] bg-white">
  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] bg-[#f7f9fb] px-3.5 py-2.5 sm:px-4">
    <h3 class="font-display text-[15px] font-semibold text-foreground">${escapeHtml(block.title)}</h3>
    ${block.badge ? `<span class="rounded-md bg-[#189b8e]/10 px-2 py-0.5 text-[11px] font-semibold text-[#189b8e]">${escapeHtml(block.badge)}</span>` : ""}
  </div>
  <div class="grid gap-0 sm:grid-cols-4">
    ${block.members
      .map((m, i) => {
        const bg = m.rarity === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg";
        const role = (m.role && m.role.trim()) || defaultRoles[i] || `Слот ${i + 1}`;
        const nameHtml = m.href
          ? `<a href="${escapeHtml(m.href)}" class="font-genshin text-center text-[13px] text-[#189b8e] hover:underline">${escapeHtml(m.name)}</a>`
          : `<p class="font-genshin text-center text-[13px] tracking-wide text-[#1e1e1e]">${escapeHtml(m.name)}</p>`;
        const avatar = `<div class="relative h-14 w-14 overflow-hidden rounded-full bg-cover bg-center ring-2 ring-white shadow-sm" style="background-image:url(${bg})">
        ${m.image ? `<img src="${escapeHtml(m.image)}" alt="${escapeHtml(m.name)}" class="h-full w-full object-cover" />` : ""}
        ${m.elementIcon ? `<img src="${escapeHtml(m.elementIcon)}" alt="" class="absolute -right-0.5 -top-0.5 h-4 w-4 drop-shadow" />` : ""}
      </div>`;
        return `<div class="flex flex-col items-center gap-1.5 border-black/[0.04] px-2.5 py-3 ${i < block.members.length - 1 ? "sm:border-r" : ""}">
      <p class="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">${escapeHtml(role)}</p>
      ${m.href ? `<a href="${escapeHtml(m.href)}" class="transition hover:opacity-90">${avatar}</a>` : avatar}
      ${nameHtml}
    </div>`;
      })
      .join("\n    ")}
  </div>
  ${block.note ? `<p class="border-t border-black/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-muted-foreground sm:px-4">${escapeHtml(block.note)}</p>` : ""}
</div>`;
  }

  if (block.type === "roleTable") {
    if (block.rows.length === 0) return "";
    return `<div class="guide-section">
  ${sectionHead(block.eyebrow || "Роли", block.title, block.intro)}
  <div class="guide-table-wrap">
    <table class="guide-table">
      <thead>
        <tr>
          <th>Персонаж</th>
          <th>Стихия</th>
          <th>Оружие</th>
          <th>Описание</th>
        </tr>
      </thead>
      <tbody>
        ${block.rows
          .map(
            (r) => `<tr>
          <td class="guide-td-center">
            <div class="guide-char-cell">
              ${
                r.href
                  ? `<a href="${escapeHtml(r.href)}" class="guide-char-cell guide-item-link">
              ${r.image ? `<img src="${escapeHtml(r.image)}" alt="" class="guide-char-icon" />` : ""}
              <span class="guide-char-name">${escapeHtml(r.name)}</span>
            </a>`
                  : `${r.image ? `<img src="${escapeHtml(r.image)}" alt="" class="guide-char-icon" />` : ""}
              <span class="guide-char-name">${escapeHtml(r.name)}</span>`
              }
            </div>
          </td>
          <td class="guide-td-center">
            <div class="guide-icon-stack">
              ${r.elementIcon ? `<img src="${escapeHtml(r.elementIcon)}" alt="" class="guide-el-icon" />` : ""}
              <span>${escapeHtml(r.element)}</span>
            </div>
          </td>
          <td class="guide-td-center">
            <div class="guide-icon-stack">
              ${r.weaponIcon ? `<img src="${escapeHtml(r.weaponIcon)}" alt="" class="guide-weapon-icon" />` : ""}
              <span>${escapeHtml(r.weapon)}</span>
            </div>
          </td>
          <td class="guide-td-desc">${escapeHtml(r.description)}</td>
        </tr>`,
          )
          .join("\n")}
      </tbody>
    </table>
  </div>
</div>`;
  }

  if (block.type === "statsTable") {
    if (block.rows.length === 0) return "";
    const [c0, c1, c2, c3, c4, c5] = block.colLabels;
    return `<div class="guide-section">
  ${sectionHead("Характеристики", block.title, block.intro)}
  <div class="guide-table-wrap">
    <table class="guide-table guide-table-stats">
      <thead>
        <tr>
          <th>${escapeHtml(c0)}</th>
          <th>${escapeHtml(c1)}</th>
          <th>${escapeHtml(c2)}</th>
          <th>${escapeHtml(c3)}</th>
          <th>${escapeHtml(c4)}</th>
          <th>${escapeHtml(c5)}</th>
        </tr>
      </thead>
      <tbody>
        ${block.rows
          .map(
            (r) => `<tr>
          <td class="guide-td-center font-bold text-foreground">${escapeHtml(r.level)}</td>
          <td class="guide-td-center">${escapeHtml(r.hp)}</td>
          <td class="guide-td-center">${escapeHtml(r.atk)}</td>
          <td class="guide-td-center">${escapeHtml(r.def)}</td>
          <td class="guide-td-center">${escapeHtml(r.baseStat)}</td>
          <td class="guide-td-center text-[#189b8e] font-bold">${escapeHtml(r.ascStat)}</td>
        </tr>`,
          )
          .join("\n")}
      </tbody>
    </table>
  </div>
</div>`;
  }

  if (block.type === "resourceTable") {
    if (block.rows.length === 0) return "";
    return `<div class="guide-section">
  ${sectionHead("Прокачка", block.title, block.intro)}
  <div class="guide-table-wrap">
    <table class="guide-table">
      <thead>
        <tr>
          <th>Ресурс</th>
          <th>Где найти</th>
        </tr>
      </thead>
      <tbody>
        ${block.rows
          .map(
            (r) => `<tr>
          <td class="guide-td-center">
            <div class="guide-resource-cell">
              ${r.image ? `<img src="${escapeHtml(r.image)}" alt="" class="guide-resource-icon" />` : ""}
              <p class="guide-char-name">${
                r.href
                  ? `<a href="${escapeHtml(r.href)}">${escapeHtml(r.name)}</a>`
                  : escapeHtml(r.name)
              }${visibleQty(r.qty) ? ` <span class="text-[#189b8e]">×${escapeHtml(visibleQty(r.qty)!)}</span>` : ""}</p>
            </div>
          </td>
          <td class="guide-td-desc">${escapeHtml(r.where)}</td>
        </tr>`,
          )
          .join("\n")}
      </tbody>
    </table>
  </div>
</div>`;
  }

  return "";
}

export function serializeGuide(blocks: GuideBlock[]): string {
  const payload = JSON.stringify(blocks);
  const html = `<section class="guide-blocks space-y-14">
${blocks
  .map((b, i) => {
    const raw = renderBlock(b, i);
    if (!raw) return "";
    if (raw.includes(`id="${guideSectionId(i)}"`)) return raw;
    return wrapSection(i, raw);
  })
  .filter(Boolean)
  .join("\n\n")}
</section>`;
  return `${MARKER_START}${payload}${MARKER_END}\n${html}`;
}

export function parseGuideBlocks(contentHtml: string | undefined | null): GuideBlock[] | null {
  if (!contentHtml) return null;
  const start = contentHtml.indexOf(MARKER_START);
  if (start < 0) return null;
  const jsonStart = start + MARKER_START.length;
  const end = contentHtml.indexOf(MARKER_END, jsonStart);
  if (end < 0) return null;
  try {
    const parsed = JSON.parse(contentHtml.slice(jsonStart, end)) as GuideBlock[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
