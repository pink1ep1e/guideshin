/**
 * ШАБЛОН seed-гайда. Скопируй в scripts/seed-<slug>-guide.ts и заполни CONFIG + блоки.
 *
 * Перед сидом:
 *   1) Правишь scripts/templates/fetch-guide-sources.ts → CONFIG
 *   2) npx tsx scripts/templates/fetch-guide-sources.ts
 *   3) Копируешь этот файл → scripts/seed-<slug>-guide.ts
 *   4) Заполняешь оружие/сеты/отряды/текст из scripts/_cache/<slug>/
 *   5) npx tsx scripts/seed-<slug>-guide.ts
 *
 * Правила:
 * - Lookup ТОЛЬКО findUnique({ where: { slug } }) — не contains по имени (Айно≠Сайно)
 * - НЕ трогать image / splashImage
 * - НЕ упоминать источники
 * - Артефакты: только Пески / Кубок / Корона
 * - Без Путешественника
 * - Имена талантов/конст из yatta-extracted (RU)
 * - Иконки талантов/конст — пути-заглушки ок (пользователь дольёт)
 */
import fs from "fs";
import path from "path";
import { PrismaClient, Rarity, Element } from "@prisma/client";
import {
  type GuideBlock,
  type GuideRoleRow,
  type GuideTeamVariant,
  serializeGuide,
  uid,
  emptyStatsRow,
} from "@/lib/guide-builder";
import { ELEMENT_SVG } from "@/lib/genshin";
import {
  createMissingLog,
  makeRankedHelpers,
  findChar,
  findWeapon,
  findArt,
  findMat,
  type CharRow,
  type WeaponRow,
  type ArtifactRow,
  type MatRow,
} from "../lib/seed-guide-helpers";

const prisma = new PrismaClient();

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const SLUG = "illugi"; // ОБЯЗАТЕЛЬНО slug из БД
const NAME = "Иллуги";
const ELEMENT = Element.GEO;
const RARITY = Rarity.EPIC; // EPIC=4★ LEGEND=5★
const WEAPON_TYPE = "Копьё";
const REGION = "Нод-Край";
const SHORT_DESC = "Иллуги — Гео саппорт Лунного кристалла: билд, оружие, сеты и отряды.";
const CACHE = path.join(process.cwd(), "scripts", "_cache", SLUG);
// ────────────────────────────────────────────────────────────────────────────

const { missingLog, noteMissing } = createMissingLog();
const { rankedWeapon, rankedArt, teamMember, matCard, artImg } = makeRankedHelpers(noteMissing);

function loadExtracted() {
  const p = path.join(CACHE, "yatta-extracted.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Нет ${p} — сначала fetch-guide-sources.ts`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as {
    talents: Record<string, { name: string; description: string; rows: { label: string; values: string[] }[] }>;
    constellations: Record<string, { name: string; description: string }>;
  };
}

function talentRows(ex: ReturnType<typeof loadExtracted>, key: string) {
  return (ex.talents[key]?.rows || []).map((r) => ({
    label: r.label,
    values: r.values,
  }));
}

async function main() {
  const existing = await prisma.character.findUnique({
    where: { slug: SLUG },
    select: { id: true, slug: true, name: true, image: true },
  });
  if (!existing) {
    console.warn(`WARNING: slug="${SLUG}" not found — will create with empty icons`);
  }
  const IMAGE = existing?.image || "";

  const [chars, weapons, artifacts, materials] = await Promise.all([
    prisma.character.findMany({
      select: { id: true, name: true, slug: true, image: true, element: true, rarity: true },
    }),
    prisma.weapon.findMany({ select: { name: true, slug: true, image: true, rarity: true } }),
    prisma.artifact.findMany({ select: { name: true, slug: true, image: true, rarity: true } }),
    prisma.material.findMany({
      select: { name: true, slug: true, image: true, rarityStars: true, category: true },
    }),
  ]);

  const charBySlug = new Map(chars.map((c) => [c.slug, c as CharRow]));
  const charByName = new Map(chars.map((c) => [c.name.toLowerCase(), c as CharRow]));
  const weaponByName = new Map(weapons.map((w) => [w.name.toLowerCase(), w as WeaponRow]));
  const artByName = new Map(artifacts.map((a) => [a.name.toLowerCase(), a as ArtifactRow]));

  const c = (...keys: string[]) => findChar(charBySlug, charByName, ...keys);
  const w = (...names: string[]) => findWeapon(weaponByName, ...names);
  const a = (...names: string[]) => findArt(artByName, ...names);
  const m = (...names: string[]) => findMat(materials as MatRow[], ...names);

  const self = (role?: string) => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.GEO,
    rarity: RARITY === Rarity.LEGEND ? (5 as const) : (4 as const),
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  // ─── FILL: оружие / артефакты / материалы / блоки ─────────────────────────
  const weaponItems = [
    rankedWeapon(w("Копьё Фавония"), 1, "Копьё Фавония", "Универсал · ВЭ", "…", "…", "S"),
  ];
  const artItems = [
    rankedArt(a("Серенада шёлковой луны", "Серенада шелковой луны"), 1, "Серенада шёлковой луны", "Топ", "…", "…", "S"),
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: `Кто такой ${NAME}`,
      body: `…`,
    },
    // prosCons, statTargets, rankedList weapons/arts, roleTable, teamGroup,
    // resourceTable, materials, statsTable, gameplay text…
  ];

  const ex = loadExtracted();
  const iconBase = `/images/talents/${SLUG}`;
  const cIconBase = `/images/constellations/${SLUG}`;
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const talents = [
    {
      id: "t_na",
      name: ex.talents["0"].name,
      icon: `${iconBase}/na.png`,
      description: ex.talents["0"].description,
      levelLabels: lv13,
      stats: talentRows(ex, "0"),
      order: 0,
    },
    {
      id: "t_skill",
      name: ex.talents["1"].name,
      icon: `${iconBase}/skill.png`,
      description: ex.talents["1"].description,
      levelLabels: lv13,
      stats: talentRows(ex, "1"),
      order: 1,
    },
    {
      id: "t_burst",
      name: ex.talents["3"].name,
      icon: `${iconBase}/burst.png`,
      description: ex.talents["3"].description,
      levelLabels: lv13,
      stats: talentRows(ex, "3"),
      order: 2,
    },
    {
      id: "t_p1",
      name: ex.talents["4"].name,
      icon: `${iconBase}/passive1.png`,
      description: ex.talents["4"].description,
      order: 3,
    },
    {
      id: "t_p2",
      name: ex.talents["5"].name,
      icon: `${iconBase}/passive2.png`,
      description: ex.talents["5"].description,
      order: 4,
    },
    {
      id: "t_p3",
      name: ex.talents["6"].name,
      icon: `${iconBase}/passive3.png`,
      description: ex.talents["6"].description,
      order: 5,
    },
    {
      id: "t_util",
      name: ex.talents["8"].name,
      icon: `${iconBase}/utility.png`,
      description: ex.talents["8"].description,
      order: 6,
    },
  ];

  const constellations = Object.entries(ex.constellations)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([k, c], i) => ({
      id: `c${Number(k) + 1}`,
      level: Number(k) + 1,
      name: c.name,
      icon: `${cIconBase}/c${Number(k) + 1}.png`,
      description: c.description,
      order: i,
    }));

  const contentHtml = serializeGuide(blocks);
  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const data = {
    name: NAME,
    rarity: RARITY,
    element: ELEMENT,
    weaponType: WEAPON_TYPE,
    region: REGION,
    sticker: null,
    shortDesc: SHORT_DESC,
    contentHtml,
    levelMaterials: [] as ReturnType<typeof matCard>[],
    talents,
    constellations,
    published: true,
    order,
  };

  let row;
  if (existing) {
    row = await prisma.character.update({
      where: { slug: SLUG },
      data, // НЕ трогаем image / splashImage
    });
  } else {
    row = await prisma.character.create({
      data: { slug: SLUG, image: "", splashImage: "", ...data },
    });
  }

  console.log("Upserted", row.id, row.slug, row.name);
  console.log("Missing stubs:", missingLog.length ? missingLog.join("; ") : "(none)");
  console.log("Guide URL: /wiki/characters/" + SLUG);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
