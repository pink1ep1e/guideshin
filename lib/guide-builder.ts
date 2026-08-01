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
  const qtyBadge = qtyLabel
    ? `<span class="absolute bottom-1.5 right-1.5 rounded-full bg-[#189b8e] px-2 py-0.5 text-[10px] font-extrabold leading-none text-white shadow-sm">×${escapeHtml(qtyLabel)}</span>`
    : "";
  const inner = `<div class="relative flex h-[100px] items-center justify-center overflow-hidden bg-cover bg-center p-1.5" style="background-image:url(${bg})">
    ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="h-full w-full object-contain" />` : `<span class="px-1 text-center text-[10px] font-bold text-muted-foreground">Нет иконки</span>`}
    ${qtyBadge}
  </div>
  <p class="line-clamp-2 min-h-[2.5em] bg-white px-1.5 py-2 text-center text-[11px] font-semibold leading-snug text-foreground" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</p>
  ${item.note ? `<p class="line-clamp-1 px-1.5 pb-2 text-center text-[10px] font-bold text-[#189b8e]" title="${escapeHtml(item.note)}">${escapeHtml(item.note)}</p>` : ""}`;
  if (item.href) {
    return `<a href="${escapeHtml(item.href)}" title="${escapeHtml(item.name)}" class="guide-item-link inline-block w-[100px] shrink-0 overflow-hidden rounded-[14px] bg-card shadow-panel ring-1 ring-black/[0.06] transition hover:opacity-95">${inner}</a>`;
  }
  return `<div class="inline-block w-[100px] shrink-0 overflow-hidden rounded-[14px] bg-card shadow-panel ring-1 ring-black/[0.06]" title="${escapeHtml(item.name)}">${inner}</div>`;
}

function sectionHead(eyebrow: string, title: string, intro?: string) {
  return `<div class="mb-4">
  ${eyebrow ? `<p class="mb-1 text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">${escapeHtml(eyebrow)}</p>` : ""}
  <h2 class="font-genshin text-2xl tracking-wide text-foreground">${escapeHtml(title)}</h2>
  ${intro ? `<p class="mt-2 text-base font-medium leading-relaxed text-muted-foreground">${escapeHtml(intro)}</p>` : ""}
</div>`;
}

function renderBlock(block: GuideBlock): string {
  if (block.type === "text") {
    return `<div>
  ${sectionHead(block.eyebrow || "Раздел", block.title, undefined)}
  <p class="text-base font-medium leading-relaxed text-muted-foreground whitespace-pre-wrap">${escapeHtml(block.body)}</p>
</div>`;
  }

  if (block.type === "video") {
    const yt = youtubeEmbedUrl(block.youtubeUrl);
    if (!yt && !block.videoUrl) return "";
    return `<div>
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
    return `<div>
  ${sectionHead(eyebrow, block.title)}
  <div class="flex flex-wrap gap-3">
    ${block.items.map(itemCardHtml).join("\n    ")}
  </div>
</div>`;
  }

  if (block.type === "team") {
    if (block.members.length === 0) return "";
    return `<div class="guide-team overflow-hidden rounded-[20px] border border-black/[0.06] bg-white shadow-soft">
  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.05] bg-[#0b1f44]/[0.03] px-4 py-3 sm:px-5">
    <h3 class="font-display text-lg font-bold text-foreground">${escapeHtml(block.title)}</h3>
    ${block.badge ? `<span class="rounded-full bg-[#189b8e]/12 px-3 py-1 text-xs font-bold text-[#189b8e]">${escapeHtml(block.badge)}</span>` : ""}
  </div>
  <div class="grid gap-0 sm:grid-cols-4">
    ${block.members
      .map((m, i) => {
        const bg = m.rarity === 5 ? "/images/legend-bg.jpg" : "/images/epic-bg.jpg";
        const nameHtml = m.href
          ? `<a href="${escapeHtml(m.href)}" class="font-genshin text-center text-[13px] text-[#189b8e] hover:underline">${escapeHtml(m.name)}</a>`
          : `<p class="font-genshin text-center text-[13px] text-foreground">${escapeHtml(m.name)}</p>`;
        const avatar = `<div class="relative h-16 w-16 overflow-hidden rounded-full bg-cover bg-center ring-2 ring-white shadow-md" style="background-image:url(${bg})">
        <img src="${escapeHtml(m.image)}" alt="${escapeHtml(m.name)}" class="h-full w-full object-cover" />
        ${m.elementIcon ? `<img src="${escapeHtml(m.elementIcon)}" alt="" class="absolute -right-0.5 -top-0.5 h-5 w-5 drop-shadow" />` : ""}
      </div>`;
        return `<div class="flex flex-col items-center gap-2 border-black/[0.05] px-3 py-4 ${i < block.members.length - 1 ? "sm:border-r" : ""}">
      <p class="text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">Персонаж ${i + 1}</p>
      ${m.href ? `<a href="${escapeHtml(m.href)}" class="transition hover:opacity-90">${avatar}</a>` : avatar}
      ${nameHtml}
    </div>`;
      })
      .join("\n    ")}
  </div>
  ${block.note ? `<p class="border-t border-black/[0.05] px-4 py-3 text-sm font-medium leading-relaxed text-muted-foreground sm:px-5">${escapeHtml(block.note)}</p>` : ""}
</div>`;
  }

  if (block.type === "roleTable") {
    if (block.rows.length === 0) return "";
    return `<div>
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
    return `<div>
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
    return `<div>
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
  const html = `<section class="space-y-10">
${blocks.map(renderBlock).filter(Boolean).join("\n\n")}
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
