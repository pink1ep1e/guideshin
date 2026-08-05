/**
 * Импорт гайда на Сандроне.
 *
 *   npx tsx scripts/seed-sandrone-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Сандроне уже корректные иконки в БД.
 */
import { PrismaClient, Rarity, Element } from "@prisma/client";
import {
  type GuideBlock,
  type GuideRankedItem,
  type GuideTeamMember,
  type GuideTeamVariant,
  type GuideRoleRow,
  type GuideSetPlanRow,
  serializeGuide,
  uid,
  emptyStatsRow,
} from "@/lib/guide-builder";
import { ELEMENT_SVG, type ElementKey } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

const prisma = new PrismaClient();

const NAME = "Сандроне";
const STUB_IMAGE = "";

const missingLog: string[] = [];

function noteMissing(kind: string, name: string) {
  const line = `${kind}: ${name}`;
  if (!missingLog.includes(line)) missingLog.push(line);
}

function rarityStars(r: Rarity): 4 | 5 {
  return r === "LEGEND" ? 5 : 4;
}

function elIcon(element: Element | string): string {
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.CRYO;
}

function elLabel(element: Element | string): string {
  const map: Record<string, string> = {
    PYRO: "Пиро",
    HYDRO: "Гидро",
    ANEMO: "Анемо",
    ELECTRO: "Электро",
    DENDRO: "Дендро",
    CRYO: "Крио",
    GEO: "Гео",
  };
  return map[String(element)] || String(element);
}

type CharRow = {
  id: number;
  name: string;
  slug: string;
  image: string;
  element: Element;
  rarity: Rarity;
};
type WeaponRow = { name: string; slug: string; image: string; rarity: Rarity };
type ArtifactRow = { name: string; slug: string; image: string; rarity: Rarity };
type MatRow = {
  name: string;
  slug: string;
  image: string;
  rarityStars: number | null;
  category: string | null;
};

function findChar(bySlug: Map<string, CharRow>, byName: Map<string, CharRow>, ...keys: string[]) {
  for (const k of keys) {
    const hit = bySlug.get(k) || byName.get(k.toLowerCase());
    if (hit) return hit;
  }
  return undefined;
}

function findWeapon(byName: Map<string, WeaponRow>, ...names: string[]) {
  for (const n of names) {
    const hit = byName.get(n.toLowerCase());
    if (hit) return hit;
  }
  for (const [k, w] of byName) {
    for (const n of names) {
      if (k.includes(n.toLowerCase()) || n.toLowerCase().includes(k)) return w;
    }
  }
  return undefined;
}

function findArt(byName: Map<string, ArtifactRow>, ...names: string[]) {
  for (const n of names) {
    const hit = byName.get(n.toLowerCase());
    if (hit) return hit;
  }
  for (const [k, a] of byName) {
    for (const n of names) {
      if (k.includes(n.toLowerCase()) || n.toLowerCase().includes(k)) return a;
    }
  }
  return undefined;
}

function findMat(mats: MatRow[], ...names: string[]) {
  for (const n of names) {
    const hit = mats.find((m) => m.name === n || m.name.includes(n) || n.includes(m.name));
    if (hit) return hit;
  }
  return undefined;
}

function rankedWeapon(
  w: WeaponRow | undefined,
  rank: number,
  fallbackName: string,
  subtitle: string,
  effect: string,
  verdict: string,
  tier?: string,
): GuideRankedItem {
  if (w) {
    return {
      id: uid(),
      rank,
      name: w.name,
      image: w.image || STUB_IMAGE,
      rarity: rarityStars(w.rarity),
      href: `/wiki/weapons/${w.slug}`,
      subtitle,
      effect,
      verdict,
      tier,
    };
  }
  noteMissing("weapon", fallbackName);
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: STUB_IMAGE,
    rarity: 5,
    subtitle: subtitle ? `${subtitle} · заглушка` : "заглушка",
    effect,
    verdict: `Заглушка — нет в БД. ${verdict}`,
    tier,
  };
}

function rankedArt(
  art: ArtifactRow | undefined,
  rank: number,
  fallbackName: string,
  subtitle: string,
  effect: string,
  verdict: string,
  tier?: string,
): GuideRankedItem {
  if (art) {
    return {
      id: uid(),
      rank,
      name: art.name,
      image: art.image || STUB_IMAGE,
      rarity: rarityStars(art.rarity),
      href: `/wiki/artifacts/${art.slug}`,
      subtitle,
      effect,
      verdict,
      tier,
    };
  }
  noteMissing("artifact", fallbackName);
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: STUB_IMAGE,
    rarity: 5,
    subtitle: subtitle ? `${subtitle} · заглушка` : "заглушка",
    effect,
    verdict: `Заглушка — нет в БД. ${verdict}`,
    tier,
  };
}

function member(c: CharRow | undefined, fallbackName: string, role?: string): GuideTeamMember {
  if (c) {
    return {
      id: uid(),
      name: c.name,
      image: c.image || STUB_IMAGE,
      elementIcon: elIcon(c.element),
      rarity: rarityStars(c.rarity),
      href: `/wiki/characters/${c.slug}`,
      role,
    };
  }
  noteMissing("character", fallbackName);
  return {
    id: uid(),
    name: fallbackName,
    image: STUB_IMAGE,
    elementIcon: ELEMENT_SVG.CRYO,
    rarity: 5,
    role: role ? `${role} · заглушка` : "заглушка",
  };
}

function variant(
  features: string,
  members: GuideTeamMember[],
  badge?: string,
): GuideTeamVariant {
  return { id: uid(), features, members, badge };
}

function planRow(
  char: CharRow | undefined,
  fallbackName: string,
  setName: string,
  setImage = "",
): GuideSetPlanRow {
  if (char) {
    return {
      id: uid(),
      name: char.name,
      image: char.image || STUB_IMAGE,
      href: `/wiki/characters/${char.slug}`,
      setName,
      setImage: setImage || STUB_IMAGE,
    };
  }
  noteMissing("character", fallbackName);
  return {
    id: uid(),
    name: fallbackName,
    image: STUB_IMAGE,
    setName: setName.includes("заглушка") ? setName : `${setName} · заглушка`,
    setImage: setImage || STUB_IMAGE,
  };
}

function roleRow(
  c: CharRow | undefined,
  fallbackName: string,
  weapon: string,
  description: string,
): GuideRoleRow {
  if (c) {
    return {
      id: uid(),
      name: c.name,
      image: c.image || STUB_IMAGE,
      element: elLabel(c.element),
      elementIcon: elIcon(c.element),
      weapon,
      weaponIcon: "",
      description,
      href: `/wiki/characters/${c.slug}`,
      rarity: rarityStars(c.rarity),
    };
  }
  noteMissing("character", fallbackName);
  return {
    id: uid(),
    name: fallbackName,
    image: STUB_IMAGE,
    element: "—",
    elementIcon: ELEMENT_SVG.CRYO,
    weapon,
    weaponIcon: "",
    description: `${description} (заглушка — нет в БД)`,
    rarity: 5,
  };
}

function matCard(
  m: MatRow | undefined,
  name: string,
  qty: number,
  category: CharacterMaterial["category"],
  rarityStars = 1,
): CharacterMaterial {
  if (!m) noteMissing("material", name);
  return {
    id: uid(),
    name: m?.name || name,
    image: m?.image || STUB_IMAGE,
    qty,
    category,
    rarityStars: m?.rarityStars || rarityStars,
  };
}

function artImg(art: ArtifactRow | undefined, fallbackName: string): string {
  if (art?.image) return art.image;
  noteMissing("artifact", fallbackName);
  return STUB_IMAGE;
}

/** Масштабирует таблицу таланта от значения на 10 ур. по типичной кривой 5★. */
function scaleTalent(l10: number, decimals = 1): string[] {
  const ratios = [
    0.5059, 0.5474, 0.5879, 0.6475, 0.6879, 0.7348, 0.7998, 0.8647, 0.9297, 1, 1.0703,
    1.1416, 1.212,
  ];
  return ratios.map((r) => `${(l10 * r).toFixed(decimals)}%`);
}

async function main() {
  const existing = await prisma.character.findFirst({
    where: {
      OR: [{ slug: "sandrone" }, { name: "Сандроне" }, { name: { contains: "Сандроне" } }],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      image: true,
      splashImage: true,
      weaponType: true,
      element: true,
      region: true,
      rarity: true,
    },
  });

  const SLUG = existing?.slug || "sandrone";
  /** Только для отображения в блоках гайда (self / setPlan) — не пишем в upsert. */
  const IMAGE = existing?.image || "";

  const [chars, weapons, artifacts, materials] = await Promise.all([
    prisma.character.findMany({
      select: { id: true, name: true, slug: true, image: true, element: true, rarity: true },
    }),
    prisma.weapon.findMany({
      select: { name: true, slug: true, image: true, rarity: true },
    }),
    prisma.artifact.findMany({
      select: { name: true, slug: true, image: true, rarity: true },
    }),
    prisma.material.findMany({
      select: { name: true, slug: true, image: true, rarityStars: true, category: true },
    }),
  ]);

  const charBySlug = new Map(chars.map((c) => [c.slug, c]));
  const charByName = new Map(chars.map((c) => [c.name.toLowerCase(), c]));
  const weaponByName = new Map(weapons.map((w) => [w.name.toLowerCase(), w]));
  const artByName = new Map(artifacts.map((a) => [a.name.toLowerCase(), a]));

  const c = (...keys: string[]) => findChar(charBySlug, charByName, ...keys);
  const w = (...names: string[]) => findWeapon(weaponByName, ...names);
  const a = (...names: string[]) => findArt(artByName, ...names);
  const m = (...names: string[]) => findMat(materials, ...names);

  const artZastyv = a("Застывшее в тени разочарование");
  const artPozol = a("Позолоченные сны");
  const artGlad = a("Конец гладиатора");
  const artGrom = a("Громогласный рёв ярости", "Громогласный рев ярости");
  const artNoblesse = a("Отголоски подношения");
  const artMetel = a("Заблудший в метели");
  const artTenacity = a("Церемония древней знати");

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.CRYO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Чайная ложка трансцендентности"),
      1,
      "Чайная ложка трансцендентности",
      "Сигна",
      "К/Ш и К/У; усиливает заряженные атаки и урон Сверхпроводника в зоне ЗП.",
      "Идеальный выбор под заряженку Фажио и Сверхпроводник.",
      "S",
    ),
    rankedWeapon(
      w("Тысяча ослепительных солнц"),
      2,
      "Тысяча ослепительных солнц",
      "К/Ш · АТК",
      "Бонус АТК; при попаданиях — доп. урон обычных и заряженных атак.",
      "Сильная универсальная замена сигны под NA/CA-цикл.",
      "A",
    ),
    rankedWeapon(
      w("Маяк тростникового моря"),
      3,
      "Маяк тростникового моря",
      "К/У · МС→АТК",
      "Бонус МС и АТК от МС; стаки после реакций.",
      "Хорош в реакционных составах — МС конвертируется в АТК.",
      "A",
    ),
    rankedWeapon(
      w("Волчья погибель"),
      4,
      "Волчья погибель",
      "АТК · универсал",
      "Высокая база АТК и процентный бонус силы атаки.",
      "Сильная легендарка без привязки к механике — стабильный личный урон.",
      "A",
    ),
    rankedWeapon(
      w("Вердикт"),
      5,
      "Вердикт",
      "К/Ш · АТК",
      "К/Ш и АТК%; при попадании — доп. АТК на короткое время.",
      "Удобная замена с критами, если нет сигны или топ-легендарок.",
      "B",
    ),
    rankedWeapon(
      w("Подвиг могучего волка"),
      6,
      "Подвиг могучего волка",
      "К/У · физ.",
      "Бонус физ. урона; при атаках — стаки АТК и скорости.",
      "Слабее на Сверхпроводнике, но даёт криты и АТК в солянке.",
      "B",
    ),
    rankedWeapon(
      w("Некованый") || w("Небесное величие") || w("Краснорогий камнеруб"),
      7,
      "Некованый / Небесное величие / Краснорогий",
      "К/Ш · АТК",
      "Некованый — АТК и К/Ш; Небесное величие — АТК и физ.; Краснорогий — К/Ш и АТК%.",
      "Бюджетные легендарки на криты и базовую АТК.",
      "B",
    ),
    rankedWeapon(
      w("Тень волны"),
      8,
      "Тень волны",
      "Лучший 4★ крафт",
      "Бонус АТК%; при попадании — доп. АТК.",
      "Лучшее эпическое двуручное из кузницы — комфортная АТК для бюджета.",
      "A",
    ),
    rankedWeapon(
      w("Меч драконьей кости") || w("Черногорская бритва") || w("Каменный меч"),
      9,
      "Меч драконьей кости / Черногорская бритва / Каменный меч",
      "F2P · АТК",
      "Драконья кость — АТК и физ.; бритва — К/Ш и АТК%; каменный меч — базовая АТК.",
      "Бесплатные и крафтовые варианты, пока нет легендарок.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artZastyv,
      1,
      "Застывшее в тени разочарование",
      "Лучший 4п",
      "2п +18% АТК; 4п — +16% К/Ш и усиление Сверхпроводника в зоне Звёздного проводника.",
      "Сигнатурный сет — цель почти всегда для мейн-дд через ЗП.",
      "S",
    ),
    rankedArt(
      artPozol,
      2,
      "Позолоченные сны",
      "АТК + МС",
      "2п МС; 4п — АТК/МС по составу отряда после реакции.",
      "Сильная альтернатива, пока копите сет; критично добрать криты в сабах.",
      "A",
    ),
    {
      id: uid(),
      rank: 3,
      name: "2+2 АТК",
      image: artGlad?.image || artPozol?.image || STUB_IMAGE,
      rarity: 5 as const,
      href: artGlad ? `/wiki/artifacts/${artGlad.slug}` : undefined,
      subtitle: "Гладиатор + АТК-сеты",
      effect:
        "2п Конец гладиатора (+18% АТК) + 2п Позолоченные сны / Застывшее в тени / другой АТК-сет.",
      verdict: "Солянка на чистые статы без сильных сетовых баффов 4п.",
      tier: "B",
    },
  ];

  const matShaft1 = m("Сломанный вал");
  const matShaft2 = m("Усиленный вал");
  const matShaft3 = m("Высокоточный вал");
  const matBook1 = m("Учения о «Скитании»", "Учения о «Скитание»");
  const matBook2 = m("Указания о «Скитании»", "Указания о «Скитание»");
  const matBook3 = m("Философия о «Скитании»", "Философия о «Скитание»");
  const matWeekly = m("Оковы безумца");

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Сандроне",
      body: `**Сандроне** — **Крио-двуручник 5★**, мейн-дд через **Звёздный проводник** и усиленный **Сверхпроводник**. Титул **Марионетка / Создание Гильотена**, 7-я **Предвестница Фатуи**. Рейтинг **S+**.

### Кратко
- **Стихия / оружие** — Крио · двуручное оружие
- **Возвышение** — крит. шанс (**+19.2%**, итого ~**24.2%** на 90 ур. с базовыми 5%)
- **База на 90 ур.** — HP **13 226** · АТК **342** · Защита **752**
- **Сигна** — **Чайная ложка трансцендентности**
- **День рождения** — 13 января
- **Особое блюдо** — **Полифония чаепития**
- **Именная карта** — Чаепитие / Sandrone: Tea Break
- **Регион / фракция** — **Снежная** · Фатуи
- **Созвездие** — **Зазеркальный Механизм**

Основной урон — **заряженные атаки** автоматона **Фажио** в режиме дешифрования. В зоне **Звёздного проводника** лучи считаются **Сверхпроводником**; кубок берите на **АТК%**, не на Крио.`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Очень сильный **мейн-дд** через заряженку и **Сверхпроводник** — топ personal DPS.",
        "**К/Ш с возвышения** и понятная сборка на **АТК%** и криты.",
        "Автоматон **Фажио** даёт стабильный AoE-урон без постоянного удержания кнопки.",
        "Пассивка переливает **АТК → МС** (до **160**) — не нужно искать МС в артефактах.",
      ],
      cons: [
        "Нужны **Электро** и **Крио**-статусы для **Сверхпроводника** и зоны **ЗП**.",
        "Управление **перегревом** Фажио — без **Е** теряется DPS в Power Overdrive.",
        "Зависит от саппортов (**Яэ**, **Эскофье**, **Ци Ци**) для комфорта и баффов.",
        "**Сигна** заметно сильнее **С1** для личного урона — без неё нужны топ-легендарки.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Сандроне",
      body: `Сборка под **мейн-дд через Звёздный проводник**. Урон в зоне ЗП считается **уроном реакции** — **кубок на АТК%**, не на Крио.

Приоритет: **АТК → криты → ВЭ**. **МС** добирается пассивкой (**до 160**). С **4п Застывшее в тени разочарование** цель по **К/Ш — 64–70%**; без сета — около **75%**. **К/У** держите в соотношении **1:2** к К/Ш (**120–160%+**). **ВЭ** — **120–140%**.

Пески — **АТК%**; кубок — **АТК%**; корона — **К/Ш / К/У**. В сабах: **криты · АТК% · ВЭ**.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "Порог **2000 АТК** — базовый минимум для полной отдачи пассивок. С сетом «Застывшее в тени» К/Ш ниже за счёт +16% от 4п.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "2000+",
          hint: "Порог для пассивок и баффа Сверхпроводника",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "64–70% (с сетом) / ~75%",
          hint: "С 4п «Застывшее в тени» — ниже; без сета — выше",
        },
        {
          id: uid(),
          label: "К/У",
          value: "120–160%+",
          hint: "Соотношение 1:2 к К/Ш",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "120–140%",
          hint: "Для комфортной ульты в ротации",
        },
        {
          id: uid(),
          label: "МС",
          value: "не искать",
          hint: "Пассивка даёт до 160 от АТК",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК%", subs: "криты · АТК% · ВЭ" },
        { id: uid(), slot: "Кубок", main: "АТК% (не Крио)", subs: "криты · АТК% · ВЭ" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "криты · АТК% · ВЭ" },
        {
          id: uid(),
          slot: "Цветок / Перо",
          main: "HP / АТК",
          subs: "криты · АТК% · ВЭ",
        },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите **криты**, **АТК** и синергию с **заряженными атаками** и **Сверхпроводником**. Сигна сильнее топ-легендарок; лучший 4★ — **Тень волны** из кузницы.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п Застывшее в тени разочарование**. Альтернатива — **Позолоченные сны** или 2+2 на статы.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в командах",
      intro: "Ориентир для составов через Звёздный проводник и Сверхпроводник.",
      groups: [
        {
          id: uid(),
          title: "Топ",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Застывшее в тени разочарование",
              setImage: artImg(artZastyv, "Застывшее в тени разочарование"),
            },
            planRow(
              c("yae-miko", "yaemiko", "яэ"),
              "Яэ Мико",
              "Громогласный рёв ярости",
              artImg(artGrom, "Громогласный рёв ярости"),
            ),
            planRow(
              c("eskofe", "escoffier", "эскофье"),
              "Эскофье",
              "Заблудший в метели",
              artImg(artMetel, "Заблудший в метели"),
            ),
            planRow(
              c("qiqi", "ци ци"),
              "Ци Ци",
              "Церемония древней знати",
              artImg(artTenacity, "Церемония древней знати"),
            ),
          ],
        },
        {
          id: uid(),
          title: "Без Яэ Мико",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Застывшее в тени разочарование",
              setImage: artImg(artZastyv, "Застывшее в тени разочарование"),
            },
            planRow(
              c("baidou", "бэй доу"),
              "Бэй Доу",
              "Громогласный рёв ярости / 2+2",
              artImg(artGrom, "Громогласный рёв ярости"),
            ),
            planRow(
              c("eskofe", "эскофье"),
              "Эскофье",
              "Заблудший в метели",
              artImg(artMetel, "Заблудший в метели"),
            ),
            planRow(
              c("diona", "диона") || c("qiqi", "ци ци"),
              "Диона / Ци Ци",
              "Церемония древней знати",
              artImg(artTenacity, "Церемония древней знати"),
            ),
          ],
        },
        {
          id: uid(),
          title: "Бюджет",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Застывшее в тени / 2+2 АТК",
              setImage: artImg(artZastyv, "Застывшее в тени разочарование"),
            },
            planRow(
              c("fischl", "фишль"),
              "Фишль",
              "Отголоски подношения / 2+2",
              artImg(artNoblesse, "Отголоски подношения"),
            ),
            planRow(
              c("sucrose", "сахароза"),
              "Сахароза",
              "Изумрудная тень / 2+2",
              artImg(artGlad, "Конец гладиатора"),
            ),
            planRow(
              c("diona", "диона"),
              "Диона",
              "Церемония древней знати",
              artImg(artTenacity, "Церемония древней знати"),
            ),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Как строить команды",
      body: `Сандроне — **мейн-дд через Звёздный проводник**: саппорты накладывают **Электро** и **Крио**, создают зону **ЗП**, затем Сандроне крутит **заряженные атаки** и **Е** для сброса перегрева Фажио.

**Яэ Мико** — лучший Электро для офф-филда; **Эскофье** — Крио-бафф и лечение; **Ци Ци** / **Диона** — щит и резонанс. **Иансан** и **Шилонен** — альтернативные бафферы.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Сандроне:",
      rows: [
        roleRow(
          c("yae-miko", "yaemiko", "яэ"),
          "Яэ Мико",
          "Катализатор",
          "Топ Электро офф-филд — стабильный статус и урон для Сверхпроводника.",
        ),
        roleRow(
          c("baidou", "бэй доу"),
          "Бэй Доу",
          "Меч",
          "Электро-щит и карманный урон — бюджетная замена Яэ.",
        ),
        roleRow(
          c("fischl", "фишль"),
          "Фишль",
          "Лук",
          "Электро для реакций и энергии без 5★ саппортов.",
        ),
        roleRow(
          c("qiqi", "ци ци"),
          "Ци Ци",
          "Меч",
          "Крио-хил и стабильный Крио-статус для ЗП.",
        ),
        roleRow(
          c("eskofe", "escoffier", "эскофье"),
          "Эскофье",
          "Копьё",
          "Крио-саппорт с баффом и лечением — ядро топ-команд.",
        ),
        roleRow(
          c("diona", "диона"),
          "Диона",
          "Лук",
          "Щит и Крио-резонанс — комфорт и защита.",
        ),
        roleRow(
          c("iansan", "иансан"),
          "Иансан",
          "Копьё",
          "Бафф АТК отряду — усиливает личный урон Сандроне.",
        ),
        roleRow(
          c("shilonen", "xilonen", "шилонен"),
          "Шилонен",
          "Меч",
          "Гео-срез резистов и комфорт в смешанных составах.",
        ),
        roleRow(
          c("nikol", "nicole", "николь"),
          "Николь",
          "Катализатор",
          "Щит и поддержка — альтернатива Дионе в защитных составах.",
        ),
        roleRow(
          c("sucrose", "сахароза"),
          "Сахароза",
          "Катализатор",
          "МС отряду, стяжка и срез резистов.",
        ),
        roleRow(
          c("shougun", "raiden", "райдэн"),
          "Райдэн",
          "Копьё",
          "Энергия и Электро-бафф — для дабл-Электро составов.",
        ),
      ],
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Варианты от топа к бюджету (без Путешественника):",
      variants: [
        variant(
          "Сигнатурный состав: Яэ на Электро, Эскофье на Крио-бафф, Ци Ци на хил и статус.",
          [
            self("Мейн-дд"),
            member(c("yae-miko", "yaemiko", "яэ"), "Яэ Мико", "Электро"),
            member(c("eskofe", "эскофье"), "Эскофье", "Крио / бафф"),
            member(c("qiqi", "ци ци"), "Ци Ци", "Хил / Крио"),
          ],
          "Топ",
        ),
        variant(
          "Без Яэ: Бэй Доу или Фишль на Электро, Эскофье на бафф, Ци Ци или Диона на защиту.",
          [
            self("Мейн-дд"),
            member(
              c("baidou", "бэй доу") || c("fischl", "фишль"),
              "Бэй Доу / Фишль",
              "Электро",
            ),
            member(c("eskofe", "эскофье"), "Эскофье", "Крио / бафф"),
            member(c("qiqi", "ци ци") || c("diona", "диона"), "Ци Ци / Диона", "Хил / щит"),
          ],
          "Без Яэ",
        ),
        variant(
          "С Николь на щит, если есть; иначе Диона закрывает защиту и Крио-резонанс.",
          [
            self("Мейн-дд"),
            member(c("yae-miko", "yaemiko", "яэ"), "Яэ Мико", "Электро"),
            member(c("eskofe", "эскофье"), "Эскофье", "Крио / бафф"),
            member(c("nikol", "nicole", "николь") || c("diona", "диона"), "Николь / Диона", "Щит"),
          ],
          "Щит",
        ),
        variant(
          "Иансан на бафф АТК: Яэ и Эскофье остаются ядром реакций.",
          [
            self("Мейн-дд"),
            member(c("yae-miko", "yaemiko", "яэ"), "Яэ Мико", "Электро"),
            member(c("eskofe", "эскофье"), "Эскофье", "Крио / бафф"),
            member(c("iansan", "иансан"), "Иансан", "Бафф АТК"),
          ],
          "Бафф АТК",
        ),
        variant(
          "Шилонен на срез резистов вместо четвёртого Крио — комфорт против толстых целей.",
          [
            self("Мейн-дд"),
            member(c("yae-miko", "yaemiko", "яэ"), "Яэ Мико", "Электро"),
            member(c("eskofe", "эскофье"), "Эскофье", "Крио / бафф"),
            member(c("shilonen", "шилонен", "xilonen"), "Шилонен", "Срез"),
          ],
          "Шилонен",
        ),
        variant(
          "Дабл Электро: Яэ + Бэй Доу на статус и урон, Ци Ци на Крио и хил.",
          [
            self("Мейн-дд"),
            member(c("yae-miko", "yaemiko", "яэ"), "Яэ Мико", "Электро"),
            member(c("baidou", "бэй доу"), "Бэй Доу", "Электро / щит"),
            member(c("qiqi", "ци ци"), "Ци Ци", "Хил / Крио"),
          ],
          "Дабл Электро",
        ),
        variant(
          "Бюджет: Фишль на Электро, Сахароза на МС и срез, Диона или Ци Ци на защиту.",
          [
            self("Мейн-дд"),
            member(c("fischl", "фишль"), "Фишль", "Электро"),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
            member(c("diona", "диона") || c("qiqi", "ци ци"), "Диона / Ци Ци", "Щит / хил"),
          ],
          "Бюджет",
        ),
        variant(
          "С Райдэн на энергию: дабл Электро + Эскофье для полного набора реакций.",
          [
            self("Мейн-дд"),
            member(c("shougun", "raiden", "райдэн"), "Райдэн", "Электро / энергия"),
            member(c("eskofe", "эскофье"), "Эскофье", "Крио / бафф"),
            member(c("diona", "диона"), "Диона", "Щит"),
          ],
          "Райдэн",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Сандроне (материалы Нод-Края + нефрит Шивада):",
      rows: [
        {
          id: uid(),
          name: m("Осколок нефрита Шивада")?.name || "Нефрит Шивада",
          image: m("Осколок нефрита Шивада")?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия нефрита Шивада)",
          href: m("Осколок нефрита Шивада")
            ? `/wiki/materials/${m("Осколок нефрита Шивада")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: (() => {
            if (!matShaft1) noteMissing("material", "Сломанный вал");
            if (!matShaft2) noteMissing("material", "Усиленный вал");
            return matShaft3?.name || "Валы механизмов";
          })(),
          image: matShaft3?.image || "",
          qty: "18 / 30 / 36",
          where: "Механизмы Нод-Края",
          href: matShaft3 ? `/wiki/materials/${matShaft3.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Перо падшего созерцателя", "Перо падшего")?.name || "Перо падшего созерцателя",
          image: m("Перо падшего созерцателя", "Перо падшего")?.image || "",
          qty: "46",
          where: "Мировой босс",
          href: (() => {
            const row = m("Перо падшего созерцателя", "Перо падшего");
            return row ? `/wiki/materials/${row.slug}` : undefined;
          })(),
        },
        {
          id: uid(),
          name: m("Миниатюрный детектор")?.name || "Миниатюрный детектор",
          image: m("Миниатюрный детектор")?.image || "",
          qty: "168",
          where: "Диковинка Нод-Края",
          href: m("Миниатюрный детектор")
            ? `/wiki/materials/${m("Миниатюрный детектор")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: (() => {
            const row = m("Опыт героя");
            if (!row) noteMissing("material", "Опыт героя");
            return row?.name || "Опыт героя (заглушка)";
          })(),
          image: m("Опыт героя")?.image || STUB_IMAGE,
          qty: "421",
          where: m("Опыт героя")
            ? "Ивенты, задания, артерии земли"
            : "Заглушка — добавьте материал «Опыт героя» в БД",
          href: m("Опыт героя") ? `/wiki/materials/${m("Опыт героя")!.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Мора")?.name || "Мора",
          image: m("Мора")?.image || "",
          qty: "1 653 000",
          where: "Любые активности (прокачка + возвышение)",
          href: m("Мора") ? `/wiki/materials/${m("Мора")!.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "materials",
      title: "Таланты (на 1 способность)",
      items: [
        {
          id: uid(),
          name: matBook1?.name || "Учения о «Скитании»",
          image: matBook1?.image || "",
          rarity: 2 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Скитании»",
          image: matBook2?.image || "",
          rarity: 3 as const,
          note: "×21",
          qty: "21",
          href: matBook2 ? `/wiki/materials/${matBook2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook3?.name || "Философия о «Скитании»",
          image: matBook3?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: matBook3 ? `/wiki/materials/${matBook3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matShaft2?.name || "Усиленный вал",
          image: matShaft2?.image || "",
          rarity: 2 as const,
          note: "×4",
          qty: "4",
          href: matShaft2 ? `/wiki/materials/${matShaft2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Оковы безумца",
          image: matWeekly?.image || "",
          rarity: 5 as const,
          note: "×4",
          qty: "4",
          href: matWeekly ? `/wiki/materials/${matWeekly.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Корона прозрения")?.name || "Корона прозрения",
          image: m("Корона прозрения")?.image || "",
          rarity: 5 as const,
          note: "×1",
          qty: "1",
          href: m("Корона прозрения")
            ? `/wiki/materials/${m("Корона прозрения")!.slug}`
            : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Характеристики при возвышении",
      intro:
        "Растёт **крит. шанс** (**+19.2%** на 90 ур., итого ~**24.2%** с базовыми 5%). Качайте до **90** — урон заряженки масштабируется от АТК.",
      colLabels: ["Уровень", "HP", "АТК", "Защита", "Базовый К/Ш", "Бонус К/Ш"],
      rows: [
        emptyStatsRow("1", "1030", "27", "59", "5%", "0%"),
        emptyStatsRow("20", "2671", "69", "152", "5%", "0%"),
        emptyStatsRow("40", "5317", "138", "302", "5%", "0%"),
        emptyStatsRow("50", "6839", "177", "389", "5%", "4.8%"),
        emptyStatsRow("60", "8579", "222", "488", "5%", "9.6%"),
        emptyStatsRow("70", "10119", "262", "576", "5%", "9.6%"),
        emptyStatsRow("80", "11669", "302", "664", "5%", "14.4%"),
        emptyStatsRow("90", "13226", "342", "752", "5%", "19.2%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Сандроне — полевой мейн через **заряженные атаки** автоматона **Фажио**. В зоне **Звёздного проводника** лучи считаются **Сверхпроводником** — основной источник урона.

### Приоритет прокачки
**NA > Q > E**

### Активные навыки
- **Формула явлений: Очевидное заключение (NA)** — до 3 ударов «клинками»; **заряженная** призывает **Фажио** в режим **дешифрования**: веерный огонь + конденсированные лучи (Крио / **Сверхпроводник** в зоне ЗП). При **100** очках Decoding Power — **Power Overdrive** с ослабленным лучом.
- **Формула явлений: Дифференциальный анализ (E)** — Фажио летит ~**6 сек.**, стреляет по целям; чинит перегрев и даёт стаки **Уточнённой тактики** для усиления **Q**.
- **Формула явлений: Ч. Т. Д. (Q)** — мощный луч **Convective Inhibition Ray** (Крио / **Сверхпроводник** в зоне ЗП).

### Пассивки
- **Свет рационализма** — **Сверхпроводник** → **Звёздный проводник**; базовый урон Сверхпроводника +**0.7%** за **100** АТК (макс. **14%**).
- **Вечный вычислительный механизм** — в зоне ЗП: **Сияние: Сверхпроводник** — +**40%** К/У лучей заряженки; каждый луч +**20%** К/У (до **3** стаков).
- **Правила поведения леди** — МС = **8%** АТК (макс. **160**).
- **Вступление и долгая история чаепития** — шанс получить доп. блюдо при готовке десертов.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Саппорты — **Электро** / **Крио**-статусы и зона **ЗП**.
2. **Заряженная атака** — циклы лучей Фажио до перегрева.
3. **Е** — сброс перегрева, стаки для **Q**.
4. **Q** — когда удобно для burst-урона.
5. Повтор **CA → E → Q**.

> Порядок: **саппорты → CA → E (перегрев) → Q → CA**

### Стоит ли выбивать?
Сильный **S+** мейн-дд с уникальной механикой **Фажио** и **Сверхпроводника**. Требует правильных саппортов, но выдаёт топ personal DPS.

### С1 или сигна?
- **Сигна (Чайная ложка трансцендентности)** — приоритет для личного DPS; обычно сильнее **С1**.
- **С1** — комфорт и усиление заряженки; **С2** и **С6** — ключевые апгрейды созвездий для эндгейма.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `**Сандроне** — седьмая из **Одиннадцати Предвестников Фатуи**, известная как **Марионетка** и **Создание Гильотена**. Она — механик и кукловод: её творения вроде **Катерины** служат Фатуи по всему Тейвату.

Связана с историей **Мари-Ан** и тайным обществом **Ордо Нарциссенкрец** — следы этой линии видны в её автоматонах и созвездии **Зазеркальный Механизм**. Предпочитает чай и десерты; особое блюдо — **Полифония чаепития**.`,
    },
  ];

  if (!matBook1) noteMissing("material", "Учения о «Скитании»");
  if (!matBook2) noteMissing("material", "Указания о «Скитании»");
  if (!matBook3) noteMissing("material", "Философия о «Скитании»");
  if (!matWeekly) noteMissing("material", "Оковы безумца");

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Миниатюрный детектор"), "Миниатюрный детектор", 168, "local", 1),
    matCard(
      m("Перо падшего созерцателя", "Перо падшего"),
      "Перо падшего созерцателя",
      46,
      "boss",
      4,
    ),
    matCard(m("Осколок нефрита Шивада"), "Осколок нефрита Шивада", 1, "ascension", 2),
    matCard(m("Фрагмент нефрита Шивада"), "Фрагмент нефрита Шивада", 9, "ascension", 3),
    matCard(m("Кусок нефрита Шивада"), "Кусок нефрита Шивада", 9, "ascension", 4),
    matCard(m("Драгоценный нефрит Шивада"), "Драгоценный нефрит Шивада", 6, "ascension", 5),
    matCard(matShaft1, "Сломанный вал", 18, "ascension", 1),
    matCard(matShaft2, "Усиленный вал", 30, "ascension", 2),
    matCard(matShaft3, "Высокоточный вал", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Скитании»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Скитании»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Скитании»", 114, "talent", 4),
    matCard(matWeekly, "Оковы безумца", 12, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Сандроне — Крио мейн-дд через Звёздный проводник: билд, оружие, сеты и отряды.";

  const iconBase = "/images/talents/sandrone";
  const cIconBase = "/images/constellations/sandrone";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const talents = [
    {
      id: "t_na",
      name: "Формула явлений: Очевидное заключение",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до трёх последовательных ударов, управляемых формулами.\n\n**Заряженная:** призывает автоматон **Фажио** в режим **дешифрования** — веерный огонь и конденсированные лучи (Крио; в зоне ЗП — **Сверхпроводник**). Decoding Power растёт; при **100** — **Power Overdrive**.\n\n**Удар в падении:** падение с уроном по площади.",
      loreText: "Очевидное заключение — когда формула становится оружием.",
      levelLabels: lv13,
      stats: [
        { label: "Урон 1 удара", values: scaleTalent(150.8) },
        { label: "Урон 2 удара", values: scaleTalent(132.8) },
        { label: "Урон 3 удара", values: scaleTalent(203.2) },
        { label: "Урон веерного огня (CA)", values: scaleTalent(85.0) },
        { label: "Урон конденсированного луча (CA)", values: scaleTalent(242.3) },
        { label: "Урон луча (Сверхпроводник)", values: scaleTalent(161.5) },
        { label: "Урон в Power Overdrive", values: scaleTalent(85.0) },
        {
          label: "Урон в падении",
          values: scaleTalent(147.4),
        },
        {
          label: "Низкий / высокий удар",
          values: scaleTalent(295, 1).map((low, i) => {
            const high = scaleTalent(368, 1)[i];
            return `${low} / ${high}`;
          }),
        },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Формула явлений: Дифференциальный анализ",
      icon: `${iconBase}/skill.png`,
      description:
        "Отправляет **Фажио** в полёт на ~**6 сек.** — автоматон стреляет по противникам, нанося **Крио** (в зоне ЗП — **Сверхпроводник**).\n\nСбрасывает **Power Overdrive**, даёт стаки **Уточнённой тактики** для усиления **Q**. Откат — **~16–18 сек.**",
      loreText: "Дифференциальный анализ — когда механизм сам находит цель.",
      levelLabels: lv13,
      stats: [
        { label: "Урон выстрела", values: scaleTalent(198.6) },
        { label: "Урон (Сверхпроводник)", values: scaleTalent(132.4) },
        { label: "Длительность полёта", values: Array(13).fill("~6 сек.") },
        { label: "Время отката", values: Array(13).fill("16 сек.") },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Формула явлений: Ч. Т. Д.",
      icon: `${iconBase}/burst.png`,
      description:
        "Выпускает **Convective Inhibition Ray** — мощный луч **Крио** (в зоне ЗП — **Сверхпроводник**). Усиливается стаками **Уточнённой тактики** от **Е**.\n\nЭнергия **~60**. Откат **~15 сек.**",
      loreText: "Q.E.D. — доказательство завершено.",
      levelLabels: lv13,
      stats: [
        { label: "Урон луча", values: scaleTalent(475.2) },
        { label: "Урон луча (Сверхпроводник)", values: scaleTalent(316.8) },
        { label: "Потребление энергии", values: Array(13).fill("60") },
        { label: "Время отката", values: Array(13).fill("15 сек.") },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Свет рационализма",
      icon: `${iconBase}/passive1.png`,
      description:
        "Когда отряд вызывает **Сверхпроводник**, реакция заменяется на **Звёздный проводник**, а базовый урон Сверхпроводника +**0.7%** за каждые **100** АТК Сандроне (макс. **14%**).",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Вечный вычислительный механизм",
      icon: `${iconBase}/passive2.png`,
      description:
        "В зоне **Звёздного проводника** — **Сияние: Сверхпроводник**: +**40%** К/У конденсированных лучей; каждый луч +**20%** К/У (до **3** стаков).",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Правила поведения леди",
      icon: `${iconBase}/passive3.png`,
      description: "Мастерство стихий повышается на **8%** от силы атаки (макс. **160**).",
      order: 5,
    },
    {
      id: "t_util",
      name: "Вступление и долгая история чаепития",
      icon: `${iconBase}/utility.png`,
      description: "При приготовлении десертов с шансом **12%** получить дополнительное блюдо.",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Малиновое утро после золотых сумерек",
      icon: `${cIconBase}/c1.png`,
      description:
        "После **Q** — **+20%** К/Ш и **+40%** К/У на **15 сек.**; заряженные атаки восстанавливают **3** энергии (раз в **2 сек.**).",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "Аристократка заглянула в зеркало",
      icon: `${cIconBase}/c2.png`,
      description:
        "В зоне **ЗП** урон **Сверхпроводника** Сандроне **+20%**; при входе в **Сияние: Сверхпроводник** — доп. стак К/У лучей.",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Разбив тень сумерек и лунное ярмо",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень **Формула явлений: Очевидное заключение** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Истинная основа мира в знании",
      icon: `${cIconBase}/c4.png`,
      description:
        "После **Е** — **+15%** АТК на **12 сек.**; стаки **Уточнённой тактики** дают доп. **+5%** урона **Q**.",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "Остальное не заботит её",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень **Формула явлений: Ч. Т. Д.** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Нарцисс пробуждается, взирая на рассвет",
      icon: `${cIconBase}/c6.png`,
      description:
        "Третий конденсированный луч заряженки становится **кластерным** — до **4** доп. ударов; весь **Сверхпроводник** Сандроне **+20%**.",
      order: 5,
    },
  ];

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const existingBySlug = await prisma.character.findUnique({ where: { slug: SLUG } });

  let row;
  if (existingBySlug) {
    row = await prisma.character.update({
      where: { slug: SLUG },
      data: {
        name: NAME,
        rarity: Rarity.LEGEND,
        element: Element.CRYO,
        weaponType: "Двуручник",
        region: "Снежная",
        sticker: null,
        shortDesc,
        contentHtml,
        levelMaterials,
        talents,
        constellations,
        published: true,
        order,
        // НЕ трогаем image / splashImage
      },
    });
  } else {
    console.warn(
      `WARNING: character slug="${SLUG}" not found — creating with empty image/splashImage. Prefer uploading icons in admin.`,
    );
    row = await prisma.character.create({
      data: {
        slug: SLUG,
        name: NAME,
        image: "",
        splashImage: "",
        rarity: Rarity.LEGEND,
        element: Element.CRYO,
        weaponType: "Двуручник",
        region: "Снежная",
        sticker: null,
        shortDesc,
        contentHtml,
        levelMaterials,
        talents,
        constellations,
        published: true,
        order,
      },
    });
  }

  const typeCounts = blocks.reduce<Record<string, number>>((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});

  console.log("Upserted", row.id, row.slug, row.name);
  console.log("IMAGE used for guide display:", IMAGE || "(empty)");
  console.log("Block types:", typeCounts);
  console.log(
    "Weapons:",
    weaponItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log(
    "Artifacts:",
    artItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log(
    "Missing from DB (stubs):",
    missingLog.length ? missingLog.join("; ") : "(none)",
  );
  console.log("Guide URL: /wiki/characters/" + SLUG);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
