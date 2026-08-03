/**
 * Импорт книг талантов с genshin-info.ru (русская локализация).
 *
 * - название, описание, лор, редкость
 * - улучшаемые персонажи (+ иконки)
 * - картинки материалов → public/uploads/materials/talent/
 *
 * Запуск:
 *   npx tsx scripts/seed-talent-books-genshin-info.ts
 *   npx tsx scripts/seed-talent-books-genshin-info.ts --limit 3
 *   npx tsx scripts/seed-talent-books-genshin-info.ts --dry
 *   npx tsx scripts/seed-talent-books-genshin-info.ts --skip-images
 *
 * На VPS после деплоя кода положите папку:
 *   public/uploads/materials/talent/
 * (или прогоните скрипт прямо на VPS с доступом в интернет и к POSTGRES_URL).
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import slugify from "slugify";
import sharp from "sharp";
import {
  buildMaterialCharactersIntro,
  emptyMaterialGuide,
  type MaterialGuideData,
} from "../lib/wiki-guide-data";

const BASE = "https://genshin-info.ru";
const LIST_URL =
  `${BASE}/wiki/predmety/uluchshenie-personazhey-i-oruzhiya/materialy-dlya-povysheniya-urovnya-navykov/`;
const OUT_DIR = path.join(process.cwd(), "public", "uploads", "materials", "talent");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const SKIP_IMAGES = args.has("--skip-images");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : null;

const prisma = new PrismaClient();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function makeSlug(name: string, fallback: string) {
  return (
    slugify(name, { lower: true, strict: true, locale: "ru" }) ||
    slugify(name, { lower: true, strict: true }) ||
    fallback
  );
}

async function fetchText(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function downloadImage(absUrl: string, destAbs: string) {
  const res = await fetch(absUrl, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`img ${res.status} ${absUrl}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(buf)
    .rotate()
    .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  await writeFile(destAbs, webp);
}

function absUrl(maybe: string) {
  if (!maybe) return "";
  if (maybe.startsWith("http")) return maybe;
  return `${BASE}${maybe.startsWith("/") ? "" : "/"}${maybe}`;
}

/** Prefer non-resized iblock path when possible. */
function preferFullImage(url: string) {
  // /upload/resize_cache/iblock/XXX/HASH/W_H_.../File.webp
  // → try /upload/iblock/XXX/File.webp
  const m = url.match(
    /\/upload\/resize_cache\/iblock\/([^/]+)\/[^/]+\/\d+_\d+_[^/]+\/([^/?#]+)$/i,
  );
  if (m) return `/upload/iblock/${m[1]}/${m[2]}`;
  return url;
}

async function listMaterialPaths(): Promise<string[]> {
  const html = await fetchText(LIST_URL);
  const links = [
    ...html.matchAll(
      /href="(\/wiki\/predmety\/uluchshenie-personazhey-i-oruzhiya\/materialy-dlya-povysheniya-urovnya-navykov\/[a-z0-9\-]+\/)"/gi,
    ),
  ].map((m) => m[1]);
  return [...new Set(links)];
}

type ScrapedChar = {
  name: string;
  imageUrl: string;
  rarityStars: number;
  sourceSlug: string;
};

type ScrapedMaterial = {
  pagePath: string;
  pageSlug: string;
  name: string;
  rarityStars: number;
  imageUrl: string;
  imageUrlRaw: string;
  description: string;
  lore: string;
  characters: ScrapedChar[];
};

function parseMaterialPage(html: string, pagePath: string): ScrapedMaterial {
  const pageSlug = pagePath.replace(/\/+$/, "").split("/").pop() || "item";

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "";
  let name = decodeHtml(h1)
    .replace(/^Предмет\s*/i, "")
    .replace(/^"+|"+$/g, "")
    .trim();
  if (!name) name = pageSlug;

  const rarityRaw =
    html.match(/materialsDetail[\s\S]{0,500}?itemcard__imgC\s+_s(\d+)/i)?.[1] ||
    html.match(/itemcard__imgC\s+_s(\d+)/i)?.[1] ||
    "4";
  const rarityStars = Math.min(5, Math.max(1, Number(rarityRaw) || 4));

  const imgRel =
    html.match(/materialsDetail[\s\S]{0,900}?data-src="([^"]+)"/i)?.[1] ||
    html.match(/materialsDetail[\s\S]{0,900}?src="([^"]+\.(?:webp|png|jpg))"/i)?.[1] ||
    "";
  // resize_cache URL стабильнее, чем «полный» iblock (часто 404)
  const imageUrlRaw = absUrl(imgRel);
  const imageUrl = imageUrlRaw;

  const detail =
    html.match(/materialsDetail[\s\S]*?(?=<h2\s+id="chars"|<h2[^>]*>\s*Улучшаемые|$)/i)?.[0] ||
    "";

  const loreRaw = detail.match(
    /<div class="materialsDetail__ingame">([\s\S]*?)<\/div>/i,
  )?.[1];
  const lore = loreRaw ? decodeHtml(loreRaw) : "";

  // Описание — текст после скрытого имени и до блока лора
  let description = "";
  const afterName = detail.split(/itemcard__name[^>]*>[\s\S]*?<\/div>/i)[1] || "";
  const beforeLore = afterName.split(/<div class="materialsDetail__ingame">/i)[0] || afterName;
  description = decodeHtml(beforeLore);
  if (!description) {
    description = `${name} — материал для повышения уровня талантов персонажей.`;
  }

  const charsSection =
    html.match(/id="chars"[\s\S]*?(?=<h2|Добавлено|<\/div>\s*<div class="card"|$)/i)?.[0] ||
    "";

  const cards = [
    ...charsSection.matchAll(
      /itemcard__imgC\s+_s(\d+)[^>]*>[\s\S]*?data-src="([^"]+)"[\s\S]*?itemprop="name">([^<]+)/gi,
    ),
  ].map((m) => ({
    rarityStars: Math.min(5, Math.max(1, Number(m[1]) || 4)),
    imageUrl: absUrl(preferFullImage(m[2])),
    name: decodeHtml(m[3]),
  }));

  const links = [
    ...charsSection.matchAll(/href="(\/wiki\/personazhi\/([^"/]+)\/?)"[^>]*>([^<]*)/gi),
  ]
    .map((m) => ({
      sourceSlug: m[2],
      name: decodeHtml(m[3]),
    }))
    .filter((x) => x.name);

  const byName = new Map(links.map((l) => [l.name.toLowerCase(), l.sourceSlug]));
  const characters: ScrapedChar[] = cards.map((c) => ({
    name: c.name,
    imageUrl: c.imageUrl,
    rarityStars: c.rarityStars,
    sourceSlug: byName.get(c.name.toLowerCase()) || makeSlug(c.name, "char"),
  }));

  return {
    pagePath,
    pageSlug,
    name,
    rarityStars,
    imageUrl,
    imageUrlRaw,
    description,
    lore,
    characters,
  };
}

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

async function saveMaterialImage(
  slug: string,
  primaryUrl: string,
  fallbackUrl?: string,
): Promise<string> {
  // Пустая строка = не трогать image в update (localImage || undefined)
  if (SKIP_IMAGES) return "";
  if (!primaryUrl && !fallbackUrl) return "";
  await ensureDir(OUT_DIR);
  const file = `${slug}.webp`;
  const abs = path.join(OUT_DIR, file);
  const urls = [...new Set([primaryUrl, fallbackUrl].filter(Boolean))] as string[];
  for (const url of urls) {
    try {
      await downloadImage(url, abs);
      return `/uploads/materials/talent/${file}`;
    } catch (e) {
      console.warn(`  ! image try fail:`, (e as Error).message);
    }
  }
  return "";
}

async function main() {
  console.log("Fetching list…");
  let paths = await listMaterialPaths();
  console.log(`Found ${paths.length} materials`);
  if (LIMIT && Number.isFinite(LIMIT)) {
    paths = paths.slice(0, LIMIT);
    console.log(`Limited to ${paths.length}`);
  }

  const dbChars = await prisma.character.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      image: true,
      element: true,
      rarity: true,
    },
  });
  const charByName = new Map(dbChars.map((c) => [c.name.trim().toLowerCase(), c]));

  if (!DRY) await ensureDir(OUT_DIR);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < paths.length; i++) {
    const pagePath = paths[i];
    const url = `${BASE}${pagePath}`;
    process.stdout.write(`[${i + 1}/${paths.length}] ${pagePath} … `);
    try {
      const html = await fetchText(url);
      const scraped = parseMaterialPage(html, pagePath);
      const slug = makeSlug(scraped.name, scraped.pageSlug);

      let localImage = "";
      if (!DRY) {
        localImage = await saveMaterialImage(
          slug,
          scraped.imageUrl,
          scraped.imageUrlRaw,
        );
      }

      const characters = scraped.characters.map((ch) => {
        const db = charByName.get(ch.name.toLowerCase());
        const rarityStars = db
          ? db.rarity === "LEGEND"
            ? 5
            : db.rarity === "EPIC"
              ? 4
              : db.rarity === "RARE"
                ? 3
                : 2
          : ch.rarityStars;
        return {
          id: db ? `c-${db.id}` : `ext-${ch.sourceSlug}`,
          name: db?.name || ch.name,
          image: db?.image || ch.imageUrl,
          element: db?.element || "",
          rarityStars,
          href: db ? `/wiki/characters/${db.slug}` : "",
        };
      });

      const guideData: MaterialGuideData = {
        ...emptyMaterialGuide(),
        description: scraped.description,
        lore: scraped.lore,
        characters,
        charactersIntro: buildMaterialCharactersIntro(scraped.name, characters),
      };

      const shortDesc =
        scraped.description.length > 160
          ? `${scraped.description.slice(0, 157).trim()}…`
          : scraped.description;

      if (DRY) {
        console.log(
          `OK dry «${scraped.name}» ★${scraped.rarityStars} chars=${characters.length}`,
        );
        await sleep(250);
        continue;
      }

      const existing = await prisma.material.findUnique({ where: { slug } });
      await prisma.material.upsert({
        where: { slug },
        create: {
          slug,
          name: scraped.name,
          image: localImage,
          rarityStars: scraped.rarityStars,
          category: "talent",
          region: null,
          shortDesc,
          contentHtml: "",
          guideData,
          published: true,
          order: i,
        },
        update: {
          name: scraped.name,
          image: localImage || undefined,
          rarityStars: scraped.rarityStars,
          category: "talent",
          shortDesc,
          guideData,
          published: true,
          order: i,
        },
      });

      if (existing) updated++;
      else created++;
      console.log(`OK «${scraped.name}» ★${scraped.rarityStars} chars=${characters.length}`);
      await sleep(350);
    } catch (e) {
      failed++;
      console.log("FAIL", (e as Error).message);
      await sleep(500);
    }
  }

  console.log("\nDone.", { created, updated, failed, outDir: OUT_DIR });
  if (!DRY) {
    console.log(
      "На VPS скопируйте папку public/uploads/materials/talent/ в uploads проекта (или запускайте скрипт на сервере).",
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
