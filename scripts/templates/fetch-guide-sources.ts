/**
 * Шаблон: скачать источники гайда (Yatta + Wotpack + опционально HoYoWiki).
 *
 * 1. Заполни CONFIG ниже.
 * 2. Запусти: npx tsx scripts/templates/fetch-guide-sources.ts
 * 3. Смотри scripts/_cache/<slug>/ — оттуда копируешь текст в seed.
 *
 * Yatta id: https://gi.yatta.moe/en/archive/avatar/<id>
 * HoYoWiki entry: https://wiki.hoyolab.com/pc/genshin/entry/<id>
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

// ─── CONFIG (править под персонажа) ─────────────────────────────────────────
const CONFIG = {
  /** Слаг в нашей БД (findUnique). Пример: illugi, yagoda, varka, loen, czy-baj, durin, pryun, skirk, shougun */
  slug: "shougun",
  /** ID аватара в Yatta / Ambr. Raiden Shogun = 10000052 */
  yattaId: "10000052",
  /** URL гайда Wotpack (RU) — текст билда/отрядов */
  wotpackUrl: "https://wotpack.ru/luchshij-bild-dlja-baal-sjogun-rajdjen-v-genshin-impact/",
  /** Опционально: entry id HoYoWiki (EN статы/таблицы) */
  hoyolabEntryId: "49",
};
// ────────────────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..", "..");
const OUT = path.join(ROOT, "scripts", "_cache", CONFIG.slug);

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "genshin-guide-fetch/1.0",
      Accept: "text/html,application/json,*/*",
    },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

function htmlToRoughMarkdown(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "config.json"), JSON.stringify(CONFIG, null, 2));

  console.log("→ Yatta RU/EN", CONFIG.yattaId);
  const [ru, en] = await Promise.all([
    fetchText(`https://gi.yatta.moe/api/v2/ru/avatar/${CONFIG.yattaId}`),
    fetchText(`https://gi.yatta.moe/api/v2/en/avatar/${CONFIG.yattaId}`),
  ]);
  fs.writeFileSync(path.join(OUT, "yatta-ru.json"), ru);
  fs.writeFileSync(path.join(OUT, "yatta-en.json"), en);

  const extractScript = path.join(ROOT, "scripts", "lib", "extract-yatta-avatar.ts");
  const extracted = path.join(OUT, "yatta-extracted.json");
  const r = spawnSync("npx", ["tsx", extractScript, path.join(OUT, "yatta-ru.json"), extracted], {
    cwd: ROOT,
    shell: true,
    encoding: "utf8",
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) throw new Error("extract-yatta-avatar failed");

  if (CONFIG.wotpackUrl) {
    console.log("→ Wotpack", CONFIG.wotpackUrl);
    try {
      const html = await fetchText(CONFIG.wotpackUrl);
      fs.writeFileSync(path.join(OUT, "wotpack.html"), html);
      fs.writeFileSync(path.join(OUT, "wotpack.txt"), htmlToRoughMarkdown(html));
    } catch (e) {
      console.warn("Wotpack fetch failed:", e);
      console.warn("Можно положить готовый .md в uploads/ и читать оттуда.");
    }
  }

  if (CONFIG.hoyolabEntryId) {
    console.log("→ HoYoWiki entry", CONFIG.hoyolabEntryId);
    try {
      const html = await fetchText(`https://wiki.hoyolab.com/pc/genshin/entry/${CONFIG.hoyolabEntryId}`);
      fs.writeFileSync(path.join(OUT, "hoyolab.html"), html);
      fs.writeFileSync(path.join(OUT, "hoyolab.txt"), htmlToRoughMarkdown(html));
    } catch (e) {
      console.warn("HoYoWiki fetch failed (часто SPA):", e);
    }
  }

  // Шаблон summary для агента
  const summary = `# Cache: ${CONFIG.slug}

Источники:
- yatta-ru.json / yatta-en.json — API
- yatta-extracted.json — имена талантов/конст + таблицы L1–13 (RU)
- wotpack.txt — текст билда/отрядов (без ссылок на источник в финальном гайде!)
- hoyolab.txt — статы EN (если скачалось)

Правила сида:
- Lookup персонажа ТОЛЬКО по slug: findUnique({ where: { slug: "${CONFIG.slug}" } })
- НЕ трогать image / splashImage
- НЕ упоминать wotpack / hoyolab
- Артефакты: только Пески / Кубок / Корона (без цветка/пера)
- Без Путешественника — альтернативы
- Имена талантов/конст — из yatta-extracted (русская локаль)
- Иконки талантов/конст можно оставить путями-заглушками — пользователь дольёт сам
`;
  fs.writeFileSync(path.join(OUT, "README.md"), summary);
  console.log("\nDone →", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
