/**
 * Извлекает из yatta JSON: таланты (L1–13), созвездия.
 * Запуск: npx tsx scripts/lib/extract-yatta-avatar.ts <ru.json> <out.json>
 *
 * Тексты чистятся в markdown-lite сайта: **акцент**, реальные переносы строк.
 */
import fs from "fs";
import path from "path";

type Promote = { description?: string | string[]; params?: number[] };
type Talent = {
  name: string;
  type?: number;
  icon?: string;
  promote?: Record<string, Promote>;
};

function fmt(v: number, format: string): string {
  if (format === "F1P" || format === "P") {
    const n = v * 100;
    return `${Number(n.toFixed(1))}%`;
  }
  if (format === "F2P") {
    const n = v * 100;
    return `${Number(n.toFixed(2))}%`;
  }
  if (format === "I") return String(Math.round(v));
  if (format === "F1") return String(Number(v.toFixed(1)));
  if (format === "F2") return String(Number(v.toFixed(2)));
  return String(v);
}

function normalizeDesc(description: string | string[] | undefined): string[] {
  if (!description) return [];
  if (Array.isArray(description)) return description.filter((s) => typeof s === "string" && s.trim());
  return String(description)
    .replace(/\\n/g, "\n")
    .split(/\n|<br\s*\/?>/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Yatta → markdown-lite для гайда:
 * {LINK#…}…{/LINK} и <color>…</color> → **…**
 * \\n / <br> → реальные переносы
 */
export function cleanYattaText(s: string): string {
  let t = String(s || "");

  t = t
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // {LINK#id}<color>Имя</color>{/LINK} или {LINK#id}Имя{/LINK}
  t = t.replace(/\{LINK#[^}]+\}([\s\S]*?)\{\/LINK\}/gi, (_, inner: string) => {
    const name = String(inner)
      .replace(/<color=[^>]*>/gi, "")
      .replace(/<\/color>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return name ? `**${name}**` : "";
  });

  // Одиночные <color>…</color>
  t = t.replace(/<color=[^>]*>([\s\S]*?)<\/color>/gi, (_, inner: string) => {
    const name = String(inner).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    return name ? `**${name}**` : "";
  });

  // Хвосты разметки
  t = t
    .replace(/\{LINK#[^}]*\}/gi, "")
    .replace(/\{\/LINK\}/gi, "")
    .replace(/<\/?color[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "");

  t = t
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\*\*\s*\*\*/g, "")
    .replace(/\*\*([^*]+)\*\*/g, (_, inner: string) => `**${inner.trim()}**`)
    .trim();

  return t;
}

/** @deprecated use cleanYattaText */
export function stripYattaMarkup(s: string): string {
  return cleanYattaText(s);
}

function extractTalent(t: Talent & { description?: string | string[] }) {
  const promote = t.promote || {};
  const levels = Object.keys(promote)
    .map(Number)
    .sort((a, b) => a - b);
  const p1 = promote[String(levels[0])] || {};
  const lines = normalizeDesc(p1.description);

  const rows: { label: string; values: string[] }[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const pipe = line.indexOf("|");
    if (pipe < 0 || !line.includes("{param")) continue;
    const label = cleanYattaText(line.slice(0, pipe)).replace(/\*\*/g, "").trim();
    const template = line.slice(pipe + 1).trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);

    const tokenRe = /\{param(\d+):([A-Z0-9]+)\}/g;
    const tokens: { idx: number; format: string; raw: string }[] = [];
    let tm: RegExpExecArray | null;
    while ((tm = tokenRe.exec(template))) {
      tokens.push({ idx: Number(tm[1]) - 1, format: tm[2], raw: tm[0] });
    }
    if (!tokens.length) continue;

    const values: string[] = [];
    for (let lv = 1; lv <= 13; lv++) {
      const p = promote[String(lv)];
      if (!p?.params) {
        values.push("");
        continue;
      }
      let rendered = template;
      for (const tok of tokens) {
        rendered = rendered.replace(tok.raw, fmt(p.params[tok.idx] ?? 0, tok.format));
      }
      values.push(cleanYattaText(rendered).replace(/\*\*/g, "").replace(/\s+/g, " ").trim());
    }
    rows.push({ label, values });
  }

  const topDesc = cleanYattaText(
    Array.isArray(t.description) ? t.description.join("\n") : String(t.description || ""),
  );
  const proseFromRows = cleanYattaText(
    lines.filter((l) => !l.includes("{param")).join("\n"),
  );

  return {
    name: t.name,
    type: t.type,
    icon: t.icon,
    description: topDesc || proseFromRows,
    rows,
  };
}

export function extractYattaAvatar(raw: unknown) {
  const j = raw as { data?: Record<string, unknown> } & Record<string, unknown>;
  const d = (j.data || j) as {
    id?: number;
    name?: string;
    rank?: number;
    element?: string;
    weaponType?: string;
    specialProp?: string;
    birthday?: number[];
    title?: string;
    fetter?: unknown;
    icon?: string;
    talent?: Record<string, Talent>;
    constellation?: Record<string, { name?: string; description?: string; icon?: string }>;
    upgrade?: unknown;
  };

  const talents: Record<string, ReturnType<typeof extractTalent>> = {};
  for (const [k, t] of Object.entries(d.talent || {}) as [string, Talent][]) {
    talents[k] = extractTalent(t);
  }

  const constellations: Record<string, { name: string; description: string; icon?: string }> = {};
  for (const [k, c] of Object.entries(d.constellation || {})) {
    if (!c?.name) continue;
    constellations[k] = {
      name: c.name,
      description: cleanYattaText(String(c.description || "")),
      icon: c.icon,
    };
  }

  return {
    id: d.id,
    name: d.name,
    rank: d.rank,
    element: d.element,
    weaponType: d.weaponType,
    specialProp: d.specialProp,
    birthday: d.birthday,
    title: d.title,
    fetter: d.fetter,
    icon: d.icon,
    talents,
    constellations,
    upgrade: d.upgrade,
  };
}

function main() {
  const src = process.argv[2];
  const dest = process.argv[3] || src.replace(/\.json$/i, "-extracted.json");
  if (!src) {
    console.error("Usage: npx tsx scripts/lib/extract-yatta-avatar.ts <yatta-ru.json> [out.json]");
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(src, "utf8"));
  const out = extractYattaAvatar(raw);

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote", dest);
  for (const [k, t] of Object.entries(out.talents)) {
    console.log(`talent ${k}: ${t.name} (${t.rows.length} rows)`);
    for (const r of t.rows.slice(0, 8)) {
      console.log(`  - ${r.label}: ${r.values[0]} → ${r.values[9] || "?"}`);
    }
  }
  for (const [k, c] of Object.entries(out.constellations)) {
    console.log(`C${Number(k) + 1}: ${c.name}`);
  }
}

const ranAsCli =
  typeof process.argv[1] === "string" &&
  /extract-yatta-avatar\.(ts|js|mts|cjs)$/i.test(process.argv[1].replace(/\\/g, "/"));
if (ranAsCli) main();
