/**
 * Импорт гайда на Арлекино.
 *
 *   npx tsx scripts/seed-arlekino-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Арлекино уже корректные иконки в БД.
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

const NAME = "Арлекино";
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
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.PYRO;
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
    elementIcon: ELEMENT_SVG.PYRO,
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
    elementIcon: ELEMENT_SVG.PYRO,
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

async function main() {
  const existing = await prisma.character.findFirst({
    where: {
      OR: [{ slug: "arlekino" }, { name: "Арлекино" }, { name: { contains: "Арлекино" } }],
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

  const SLUG = existing?.slug || "arlekino";
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

  const artFragment = a("Фрагмент гармонической фантазии");
  const artGlad = a("Конец гладиатора");
  const artDesert = a("Хроники Чертогов в пустыне");
  const artWitch = a("Горящая алая ведьма");
  const artHunter = a("Охотник Сумеречного двора");
  const artNoblesse = a("Отголоски подношения");
  const artVV = a("Изумрудная тень");
  const artLava = a("Ступающий по лаве");
  const artEmblem = a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы");

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.PYRO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Очертания алой луны"),
      1,
      "Очертания алой луны",
      "Сигна",
      "К/Ш и К/У; при HP ≥30% — бонус АТК; после Е — доп. АТК от Долга жизни.",
      "Идеальный выбор под Долг жизни и режим «Маска алой смерти».",
      "S",
    ),
    rankedWeapon(
      w("Нефритовый коршун"),
      2,
      "Нефритовый коршун",
      "Высокая база · К/Ш",
      "Стаки АТК при попаданиях; на 7 стаках — доп. урон.",
      "Сильная универсальная замена сигны — быстрые удары легко держат стаки.",
      "A",
    ),
    rankedWeapon(
      w("Посох Хомы"),
      3,
      "Посох Хомы",
      "К/У · HP→АТК",
      "Бонус HP и АТК от макс. HP; доп. АТК при HP ниже 50%.",
      "Отличный К/У; с постоянным Долгом жизни второй бонус почти не нужен.",
      "A",
    ),
    rankedWeapon(
      w("Посох алых песков"),
      4,
      "Посох алых песков",
      "К/Ш · МС→АТК",
      "Бонус АТК от МС; стаки после Е.",
      "Хорош при реакционных сборках — МС конвертируется в АТК.",
      "A",
    ),
    rankedWeapon(
      w("Усмиритель бед"),
      5,
      "Усмиритель бед",
      "АТК · универсал",
      "Высокая база АТК и процентный бонус силы атаки.",
      "Сильная легендарка без привязки к HP — стабильный урон вне зависимости от Долга.",
      "A",
    ),
    rankedWeapon(
      w("Небесная ось"),
      6,
      "Небесная ось",
      "ВЭ · К/Ш",
      "ВЭ и К/Ш; при попаданиях — небольшой бонус АТК.",
      "Удобна для закрытия энергии ульты на 60 ед.",
      "B",
    ),
    rankedWeapon(
      w("Покоритель вихря"),
      7,
      "Покоритель вихря",
      "Щит · АТК",
      "Прочность щита + стаки АТК; под щитом стаки удваиваются.",
      "Хорош со щитом Чжун Ли; без щита заметно слабее.",
      "B",
    ),
    rankedWeapon(
      w("Смертельный бой"),
      8,
      "Смертельный бой",
      "Лучший 4★ BP",
      "После Е — стаки АТК и ВЭ (до 3), работает из кармана.",
      "Лучшее эпическое копьё: комфорт ВЭ и АТК для бюджетной сборки.",
      "A",
    ),
    rankedWeapon(
      w("Баллада фьордов"),
      9,
      "Баллада фьордов",
      "К/Ш · МС",
      "При 3 разных стихиях в отряде — большой МС.",
      "Полезна в реакционных командах с тремя элементами.",
      "B",
    ),
    rankedWeapon(
      w("Гроза драконов"),
      10,
      "Гроза драконов",
      "Пар · АТК",
      "Бонус АТК; при реакции Пар — доп. АТК на 12 сек.",
      "Сильна в пар-командах с Гидро-аппликаторами.",
      "B",
    ),
    rankedWeapon(
      w("Белая кисть"),
      11,
      "Белая кисть",
      "F2P · АТК",
      "Бонус АТК; при попадании — небольшой доп. АТК.",
      "Лучший бесплатный вариант из кузницы.",
      "C",
    ),
    rankedWeapon(
      w("Черногорская пика"),
      12,
      "Черногорская пика",
      "К/Ш · ATK%",
      "К/Ш и АТК%; стаки АТК при победах над врагами.",
      "Бюджетная замена с критами — нужно держать стаки.",
      "C",
    ),
    rankedWeapon(
      w("Пронзающий луну"),
      13,
      "Пронзающий луну",
      "Крафт · МС",
      "АТК и МС после реакций.",
      "Крафтовое копьё для реакционных сборок без легендарок.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artFragment,
      1,
      "Фрагмент гармонической фантазии",
      "Лучший 4п",
      "2п +18% АТК; 4п — стаки АТК при поглощении Долга жизни (до 36% АТК).",
      "Сигнатурный сет — цель почти всегда для мейн-дд от Долга.",
      "S",
    ),
    rankedArt(
      artGlad,
      2,
      "Конец гладиатора",
      "2п АТК",
      "2п +18% АТК; 4п +35% урона обычных атак.",
      "Сильная альтернатива 2+2 или 4п на чистый урон NA.",
      "A",
    ),
    rankedArt(
      artDesert,
      3,
      "Хроники Чертогов в пустыне",
      "2п АТК · 4п NA",
      "2п +18% АТК; 4п +35% урона заряженных и обычных атак.",
      "Хорош при фокусе на заряженные и обычные удары.",
      "A",
    ),
    rankedArt(
      artWitch,
      4,
      "Горящая алая ведьма",
      "Реакции",
      "2п +15% Пиро; 4п +40% урон реакций Пиро.",
      "Для реакционных сборок (Пар, Перегрузка, Горение).",
      "A",
    ),
    {
      id: uid(),
      rank: 5,
      name: "2+2 АТК / Пиро / NA",
      image: artGlad?.image || artWitch?.image || artHunter?.image || STUB_IMAGE,
      rarity: 5 as const,
      href: artGlad ? `/wiki/artifacts/${artGlad.slug}` : undefined,
      subtitle: "Гладиатор + Ведьма + Охотник",
      effect:
        "2п Конец гладиатора (+18% АТК) + 2п Горящая алая ведьма / Охотник Сумеречного двора / Хроники.",
      verdict: "Солянка на чистые статы без сильных сетовых баффов 4п.",
      tier: "B",
    },
  ];

  const matIns1 = m(
    "Знак шеврона новобранца",
    "Знак новобранца",
    "рядового",
    "новобранца",
    "шеврон",
  );
  const matIns2 = m("Шеврон сержанта", "Знак сержанта", "сержанта");
  const matIns3 = m("Шеврон офицера", "Знак лейтенанта", "офицера", "лейтенанта");
  const matBook1 = m("Учения о «Порядке»");
  const matBook2 = m("Указания о «Порядке»");
  const matBook3 = m("Философия о «Порядке»");
  const matWeekly = m("Угасающая свеча", "Пепел пылающего сердца");

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Арлекино",
      body: `**Арлекино** — **Пиро-копьё 5★**, мейн-дд от **Долга жизни**. Титул **Слуга**, 4-я **Предвестница Фатуи**, **Дом очага**. Рейтинг **S**.

### Кратко
- **Стихия / оружие** — Пиро · копьё
- **Возвышение** — крит. урон (**+38.4%**, итого ~**88.4%** на 90 ур.)
- **База на 90 ур.** — HP **13 103** · АТК **342** · Защита **764**
- **Сигна** — **Очертания алой луны**
- **День рождения** — 22 августа
- **Регион / фракция** — **Снежная** · Фатуи · Дом очага
- **Созвездие** — **Очищающий Огонь**
- **Особое блюдо** — **Следы огня**

Урон строится на **Долге жизни** и режиме **«Маска алой смерти»** (Пиро-инфузия при Долге ≥30% HP). Сильна и в одиночных целях, и в AoE; заряженная атака позволяет **парить над водой**.`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Универсальный и очень сильный **мейн-дд** — топ и в реакциях, и в моно-Пиро.",
        "**Пиро-инфузия** при Долге жизни ≥30% HP — стабильный элементальный урон без внешней инфузии.",
        "Сильна и в **AoE**, и против **одиночных** целей; **парение над водой** через заряженную атаку.",
        "**К/У** с возвышения и удобная **ульта на 60 энергии**.",
      ],
      cons: [
        "Сложна **новичкам** — нужно управлять Долгом жизни и таймингами Е/Q.",
        "Нет **внешнего хила** — лечится только через **Q** (пассивка блокирует обычное лечение).",
        "Без **С1** нет устойчивости к **прерыванию** в режиме «Маска алой смерти».",
        "Идеально раскрывается с **сигной** — без неё заметно слабее топ-легендарок.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Арлекино",
      body: `Сборка под **мейн-дд от Долга жизни**. Приоритет: **АТК → криты → ВЭ → МС** (МС добирается через реакции и пассивки).

**АТК 1800+** (до **3000** для максимума резистов от пассивки «Лишь сила защитит»). **К/Ш 60%+**, **К/У 120%+** с учётом возвышения. **ВЭ 120–140%** для перегрузки/моно/горения; **140–160%** для пар/таяния. **МС 150–250** через реакции.

Пески — **АТК% / МС**; кубок — **АТК% / Пиро**; корона — **К/Ш / К/У**. В сабах: **криты · АТК% · МС / ВЭ**.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "Порог **1800 АТК** — базовый минимум; **3000 АТК** — для полной отдачи пассивки резистов. ВЭ зависит от типа команды.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "1800+ (3000 для резистов)",
          hint: "Порог для пассивки «Лишь сила защитит»",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "60%+",
          hint: "Критический шанс",
        },
        {
          id: uid(),
          label: "К/У",
          value: "120%+",
          hint: "С учётом +38.4% от возвышения",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "120–160%",
          hint: "120–140% перегрузка/моно; 140–160% пар/таяние",
        },
        {
          id: uid(),
          label: "МС",
          value: "150–250",
          hint: "Через реакции и саппортов",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК% / МС", subs: "криты · АТК% · МС / ВЭ" },
        { id: uid(), slot: "Кубок", main: "АТК% / Пиро", subs: "криты · АТК% · МС / ВЭ" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "криты · АТК% · МС / ВЭ" },
        {
          id: uid(),
          slot: "Цветок / Перо",
          main: "HP / АТК",
          subs: "криты · АТК% · МС / ВЭ",
        },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите **криты**, **АТК** и синергию с **Долгом жизни**. Сигна сильнее топ-легендарок; лучший 4★ — **Смертельный бой** из Battle Pass.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п Фрагмент гармонической фантазии**. Альтернативы — Гладиатор, Хроники, Ведьма или 2+2 на статы.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в командах",
      intro: "Ориентир для пар-, перегрузочных и моно-Пиро составов.",
      groups: [
        {
          id: uid(),
          title: "Пар",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Фрагмент гармонической фантазии",
              setImage: artImg(artFragment, "Фрагмент гармонической фантазии"),
            },
            planRow(
              c("yelan", "е лань"),
              "Е Лань",
              "Отголоски подношения",
              artImg(artNoblesse, "Отголоски подношения"),
            ),
            planRow(
              c("kazuha", "кадзуха"),
              "Кадзуха",
              "Изумрудная тень",
              artImg(artVV, "Изумрудная тень"),
            ),
            planRow(
              c("bennett", "беннет"),
              "Беннет",
              "Отголоски подношения",
              artImg(artNoblesse, "Отголоски подношения"),
            ),
          ],
        },
        {
          id: uid(),
          title: "Перегрузка",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Фрагмент гармонической фантазии",
              setImage: artImg(artFragment, "Фрагмент гармонической фантазии"),
            },
            planRow(
              c("shevryez", "chevreuse", "шеврёз", "шеврез"),
              "Шеврез",
              "Золотая трупе / 2+2",
              artImg(artGlad, "Конец гладиатора"),
            ),
            planRow(
              c("fischl", "фишль"),
              "Фишль",
              "Золотая трупе / 2+2",
              artImg(artGlad, "Конец гладиатора"),
            ),
            planRow(
              c("thoma", "тома"),
              "Тома",
              "Ступающий по лаве",
              artImg(artLava, "Ступающий по лаве"),
            ),
          ],
        },
        {
          id: uid(),
          title: "Моно-Пиро",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Фрагмент гармонической фантазии",
              setImage: artImg(artFragment, "Фрагмент гармонической фантазии"),
            },
            planRow(
              c("xiangling", "сян лин"),
              "Сян Лин",
              "Эмблема рассечённой судьбы",
              artImg(artEmblem, "Эмблема рассечённой судьбы"),
            ),
            planRow(
              c("kazuha", "кадзуха"),
              "Кадзуха",
              "Изумрудная тень",
              artImg(artVV, "Изумрудная тень"),
            ),
            planRow(
              c("thoma", "тома"),
              "Тома",
              "Ступающий по лаве / Отголоски",
              artImg(artLava, "Ступающий по лаве"),
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
      body: `Арлекино — **универсальный мейн-дд**: работает в **Паре**, **Перегрузке**, **моно-Пиро**, **горении** и **таянии**. Ядро — её **Е** для Долга жизни и **NA/CA** в режиме «Маска алой смерти».

Гидро-аппликаторы (**Е Лань**, **Син Цю**) — для Пара; **Шеврез** — для Перегрузки; **Беннет** / **Ситлали** — универсальные бафферы. **Кадзуха** или **Сахароза** — срез резистов и МС.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Арлекино:",
      rows: [
        roleRow(
          c("yelan", "е лань"),
          "Е Лань",
          "Лук",
          "Карманный Гидро и бафф урона — топ для Пара.",
        ),
        roleRow(
          c("xingqiu", "sinqiu", "син цю"),
          "Син Цю",
          "Меч",
          "Стабильный Гидро-статус для Пара и защиты.",
        ),
        roleRow(
          c("bennett", "беннет"),
          "Беннет",
          "Меч",
          "Бафф АТК и хил — универсальный саппорт.",
        ),
        roleRow(
          c("zhongli", "чжун ли"),
          "Чжун Ли",
          "Копьё",
          "Щит и срез резистов — комфорт и урон.",
        ),
        roleRow(
          c("kazuha", "кадзуха"),
          "Кадзуха",
          "Меч",
          "Срез резистов, стяжка и МС для реакций.",
        ),
        roleRow(
          c("shevryez", "chevreuse", "шеврёз", "шеврез"),
          "Шеврез",
          "Копьё",
          "Ядро перегрузочных команд — снижение Пиро/Электро резистов.",
        ),
        roleRow(
          c("fischl", "фишль"),
          "Фишль",
          "Лук",
          "Электро для перегрузки и карманный урон.",
        ),
        roleRow(
          c("thoma", "тома"),
          "Тома",
          "Копьё",
          "Щит и Пиро-резонанс для моно-Пиро.",
        ),
        roleRow(
          c("yun-tszin", "yunjin", "yun-jin", "юнь цзинь"),
          "Юнь Цзинь",
          "Копьё",
          "Бафф обычных атак — сильна в NA-командах.",
        ),
        roleRow(
          c("sitlali", "citlali", "ситлали"),
          "Ситлали",
          "Катализатор",
          "Крио-бафф и срез резистов для таяния/пара.",
        ),
        roleRow(
          c("shilonen", "xilonen", "шилонен"),
          "Шилонен",
          "Меч",
          "Гео-срез резистов и комфорт.",
        ),
        roleRow(
          c("nahida", "нахида"),
          "Нахида",
          "Катализатор",
          "Дендро для горения и три-элементных составов.",
        ),
        roleRow(
          c("xiangling", "сян лин"),
          "Сян Лин",
          "Копьё",
          "Саб-дд Пиро для моно-Пиро и бюджетных команд.",
        ),
        roleRow(
          c("dehya", "дэхья"),
          "Дэхья",
          "Двуручный меч",
          "Офф-филд Пиро и защита — альтернатива в моно-Пиро.",
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
          "Лунный заряд: Айно на Гидро и знамение, Инеффа на щит и бафф, Сахароза на МС.",
          [
            self("Мейн-дд"),
            member(c("ajno", "айно"), "Айно", "Гидро"),
            member(c("ineffa", "инеффа"), "Инеффа", "Щит / саб-дд"),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
          ],
          "Топ",
        ),
        variant(
          "Пар: Е Лань или Син Цю на Гидро, Кадзуха или Сахароза на срез, Беннет или Ситлали на бафф.",
          [
            self("Мейн-дд"),
            member(c("yelan", "е лань") || c("xingqiu", "син цю"), "Е Лань / Син Цю", "Гидро"),
            member(
              c("kazuha", "кадзуха") || c("sucrose", "сахароза"),
              "Кадзуха / Сахароза",
              "Анемо",
            ),
            member(c("bennett", "беннет") || c("sitlali", "citlali", "ситлали"), "Беннет / Ситлали", "Бафф"),
          ],
          "Пар",
        ),
        variant(
          "Перегрузка: Шеврез на резисты, Фишль на Электро, Тома на щит и резонанс.",
          [
            self("Мейн-дд"),
            member(c("shevryez", "chevreuse", "шеврёз", "шеврез"), "Шеврез", "Перегрузка"),
            member(c("fischl", "фишль"), "Фишль", "Электро"),
            member(c("thoma", "тома"), "Тома", "Щит / Пиро"),
          ],
          "Перегрузка",
        ),
        variant(
          "Пар со щитом: Е Лань на Гидро, Беннет на бафф, Чжун Ли на щит и срез.",
          [
            self("Мейн-дд"),
            member(c("yelan", "е лань"), "Е Лань", "Гидро"),
            member(c("bennett", "беннет"), "Беннет", "Бафф"),
            member(c("zhongli", "чжун ли"), "Чжун Ли", "Щит"),
          ],
          "Пар + щит",
        ),
        variant(
          "Моно-Пиро: Сян Лин на саб-дд, Кадзуха на срез, Тома на щит и резонанс.",
          [
            self("Мейн-дд"),
            member(c("xiangling", "сян лин"), "Сян Лин", "Саб-дд"),
            member(c("kazuha", "кадзуха"), "Кадзуха", "Анемо"),
            member(c("thoma", "тома"), "Тома", "Щит"),
          ],
          "Моно-Пиро",
        ),
        variant(
          "Горение: Нахида на Дендро, Сахароза на стяжку, Беннет на бафф.",
          [
            self("Мейн-дд"),
            member(c("nahida", "нахида"), "Нахида", "Дендро"),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
            member(c("bennett", "беннет"), "Беннет", "Бафф"),
          ],
          "Горение",
        ),
        variant(
          "Таяние: Кэйа или Розария на Крио, Сахароза на срез, Беннет на бафф.",
          [
            self("Мейн-дд"),
            member(c("kaeya", "кэйа") || c("rosaria", "розария"), "Кэйа / Розария", "Крио"),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
            member(c("bennett", "беннет"), "Беннет", "Бафф"),
          ],
          "Таяние",
        ),
        variant(
          "Бюджет: Сян Лин на Пиро, Линетт на срез, Барбара или Ноэлль на хил.",
          [
            self("Мейн-дд"),
            member(c("xiangling", "сян лин"), "Сян Лин", "Саб-дд"),
            member(c("linett", "линетт"), "Линетт", "Анемо"),
            member(
              c("barbara", "барбара") || c("noelle", "noel", "ноэлль"),
              "Барбара / Ноэлль",
              "Хил",
            ),
          ],
          "Бюджет",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Арлекино (материалы Фонтейна + агат Агнидус):",
      rows: [
        {
          id: uid(),
          name: m("Осколок агата Агнидус")?.name || "Агат Агнидус",
          image: m("Осколок агата Агнидус")?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия агата Агнидус)",
          href: m("Осколок агата Агнидус")
            ? `/wiki/materials/${m("Осколок агата Агнидус")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: (() => {
            if (!matIns1) noteMissing("material", "Шеврон новобранца");
            if (!matIns2) noteMissing("material", "Шеврон сержанта");
            return matIns3?.name || "Шевроны Фатуи";
          })(),
          image: matIns3?.image || "",
          qty: "18 / 30 / 36",
          where: "Фатуи (рядовые, сержанты, офицеры)",
          href: matIns3 ? `/wiki/materials/${matIns3.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Фрагмент золотой мелодии")?.name || "Фрагмент золотой мелодии",
          image: m("Фрагмент золотой мелодии")?.image || "",
          qty: "46",
          where: "Мировой босс «Гармоническое воображение»",
          href: m("Фрагмент золотой мелодии")
            ? `/wiki/materials/${m("Фрагмент золотой мелодии")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Радужная роза")?.name || "Радужная роза",
          image: m("Радужная роза")?.image || "",
          qty: "168",
          where: "Диковинка Фонтейна",
          href: m("Радужная роза") ? `/wiki/materials/${m("Радужная роза")!.slug}` : undefined,
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
          name: matBook1?.name || "Учения о «Порядке»",
          image: matBook1?.image || "",
          rarity: 4 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Порядке»",
          image: matBook2?.image || "",
          rarity: 4 as const,
          note: "×21",
          qty: "21",
          href: matBook2 ? `/wiki/materials/${matBook2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook3?.name || "Философия о «Порядке»",
          image: matBook3?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: matBook3 ? `/wiki/materials/${matBook3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matIns2?.name || "Шеврон сержанта",
          image: matIns2?.image || "",
          rarity: 2 as const,
          note: "×4",
          qty: "4",
          href: matIns2 ? `/wiki/materials/${matIns2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWeekly?.name || "Угасающая свеча",
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
        "Растёт **крит. урон** (**+38.4%** на 90 ур., итого ~**88.4%** с базовыми 50%). Качайте до **90** — урон от Долга жизни масштабируется от АТК.",
      colLabels: ["Уровень", "HP", "АТК", "Защита", "Базовый К/У", "Бонус К/У"],
      rows: [
        emptyStatsRow("1", "1020", "27", "60", "50%", "0%"),
        emptyStatsRow("20", "2646", "69", "154", "50%", "0%"),
        emptyStatsRow("40", "5268", "138", "307", "50%", "0%"),
        emptyStatsRow("50", "6776", "177", "395", "50%", "9.6%"),
        emptyStatsRow("60", "8500", "222", "496", "50%", "19.2%"),
        emptyStatsRow("70", "10025", "262", "585", "50%", "19.2%"),
        emptyStatsRow("80", "11561", "302", "675", "50%", "28.8%"),
        emptyStatsRow("90", "13103", "342", "765", "50%", "38.4%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Арлекино — полевой мейн через **Долг жизни** и режим **«Маска алой смерти»**. **Е** ставит директивы и даёт Долг; **Q** лечит и сбрасывает откат **Е**. Урон NA масштабируется от АТК и процента текущего Долга.

### Приоритет прокачки
**NA > Q > E**

### Активные навыки
- **Приглашение на казнь (NA)** — до 6 ударов копьём; заряженная — рывок с ударом (можно **парить над водой**); при Долге ≥30% HP — **Пиро-инфузия** и доп. урон от Долга.
- **Все превращается в прах (E)** — Пиро по площади + рывок; накладывает **Директиву долга** (урон каждые 5 сек.). Поглощение директив заряженной/Q даёт **Долг жизни**.
- **Восхождение роковой луны (Q)** — AoE Пиро, поглощает директивы, **лечит** от Долга и АТК, сбрасывает откат **Е** (**60** энергии).

### Пассивки
- **Лишь страдания искупят** — при убийстве цели с директивой или после апгрейда до «Долга» — Долг жизни 130% HP.
- **Лишь сила защитит** — +1% ко всем резистам за каждые 100 АТК сверх 1000 (макс. **20%** каждого).
- **Лишь пепел насытит** — +40% **Пиро DMG**; лечится **только через Q**.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Саппорты — баффы и элементальные статусы.
2. **Е** — директивы и вход в бой.
3. **Заряженная атака** — поглощение директив, набор Долга.
4. **NA** в режиме «Маска алой смерти».
5. Повтор **Е** → **Q** для лечения и сброса отката.

> Порядок: **Е → саппорты → CA → NA → Е → Q**

### Стоит ли выбивать?
Сильный **S** мейн-дд с уникальной механикой Долга жизни. Универсальна в разных реакциях, но требует привыкания к управлению HP.

### С1 или сигна?
- **Сигна (Очертания алой луны)** — приоритет, если нет **Нефритового коршуна**, **Посоха Хомы** или **Посоха алых песков**.
- **С1** — устойчивость к прерыванию и усиление «Маски алой смерти»; важна для комфорта без сигны.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `**Арлекино** — **Слуга**, четвёртая из **Одиннадцати Предвестников Фатуи**. Для детей **Дома очага** она — строгая, но надёжная **«Отец»**.

Возглавляет дом, где воспитывают сирот Фонтейна и Снежной. Её методы жестоки, но дети видят в ней защиту и семью. Созвездие **Очищающий Огонь** отражает её роль — сжигать прошлое ради новой жизни.`,
    },
  ];

  if (!matBook1) noteMissing("material", "Учения о «Порядке»");
  if (!matBook2) noteMissing("material", "Указания о «Порядке»");
  if (!matBook3) noteMissing("material", "Философия о «Порядке»");
  if (!matWeekly) noteMissing("material", "Угасающая свеча");

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Радужная роза"), "Радужная роза", 168, "local", 1),
    matCard(m("Фрагмент золотой мелодии"), "Фрагмент золотой мелодии", 46, "boss", 4),
    matCard(m("Осколок агата Агнидус"), "Осколок агата Агнидус", 1, "ascension", 2),
    matCard(m("Фрагмент агата Агнидус"), "Фрагмент агата Агнидус", 9, "ascension", 3),
    matCard(m("Кусок агата Агнидус"), "Кусок агата Агнидус", 9, "ascension", 4),
    matCard(m("Драгоценный агат Агнидус"), "Драгоценный агат Агнидус", 6, "ascension", 5),
    matCard(matIns1, "Шеврон новобранца", 18, "ascension", 1),
    matCard(matIns2, "Шеврон сержанта", 30, "ascension", 2),
    matCard(matIns3, "Шеврон офицера", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Порядке»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Порядке»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Порядке»", 114, "talent", 4),
    matCard(matWeekly, "Угасающая свеча", 12, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Арлекино — Пиро мейн-дд от Долга жизни: билд, оружие, сеты и отряды.";

  const iconBase = "/images/talents/arlekino";
  const cIconBase = "/images/constellations/arlekino";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const talents = [
    {
      id: "t_na",
      name: "Приглашение на казнь",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до шести последовательных ударов копьём.\n\n**Заряженная:** тратит выносливость, рывок к противнику и удар; удержание — до 5 сек. быстрого движения (можно парить над водой).\n\n**Удар в падении:** падение с уроном по площади.\n\n**Маска алой смерти:** при Долге жизни ≥30% HP — Пиро-инфузия NA/CA/падения и доп. урон от АТК × % Долга (расход 7.5% Долга за удар).",
      loreText: "Каждый удар — приглашение на суд последней инстанции.",
      levelLabels: lv13,
      stats: [
        {
          label: "Бонус «Маски алой смерти»",
          values: [
            "120.4%",
            "130.2%",
            "140.0%",
            "154.0%",
            "163.8%",
            "175.0%",
            "190.4%",
            "205.8%",
            "221.2%",
            "238.0%",
            "254.8%",
            "271.6%",
            "288.4%",
          ],
        },
        {
          label: "Урон 1 удара",
          values: [
            "47.5%",
            "51.4%",
            "55.2%",
            "60.8%",
            "64.6%",
            "69.0%",
            "75.1%",
            "81.2%",
            "87.3%",
            "93.9%",
            "100.5%",
            "107.2%",
            "113.8%",
          ],
        },
        {
          label: "Урон 2 удара",
          values: [
            "52.1%",
            "56.3%",
            "60.6%",
            "66.6%",
            "70.9%",
            "75.7%",
            "82.4%",
            "89.1%",
            "95.7%",
            "103.0%",
            "110.3%",
            "117.5%",
            "124.8%",
          ],
        },
        {
          label: "Урон 3 удара",
          values: [
            "65.4%",
            "70.7%",
            "76.0%",
            "83.6%",
            "89.0%",
            "95.0%",
            "103.4%",
            "111.8%",
            "120.1%",
            "129.3%",
            "138.4%",
            "147.5%",
            "156.6%",
          ],
        },
        {
          label: "Урон 4 удара",
          values: [
            "37.1%×2",
            "40.2%×2",
            "43.2%×2",
            "47.5%×2",
            "50.5%×2",
            "54.0%×2",
            "58.7%×2",
            "63.5%×2",
            "68.2%×2",
            "73.4%×2",
            "78.6%×2",
            "83.8%×2",
            "89.0%×2",
          ],
        },
        {
          label: "Урон 5 удара",
          values: [
            "70.0%",
            "75.7%",
            "81.4%",
            "89.5%",
            "95.2%",
            "101.7%",
            "110.7%",
            "119.6%",
            "128.6%",
            "138.3%",
            "148.1%",
            "157.9%",
            "167.6%",
          ],
        },
        {
          label: "Урон 6 удара",
          values: [
            "85.4%",
            "92.3%",
            "99.3%",
            "109.2%",
            "116.2%",
            "124.1%",
            "135.0%",
            "145.9%",
            "156.9%",
            "168.8%",
            "180.7%",
            "192.6%",
            "204.5%",
          ],
        },
        {
          label: "Урон заряженной атаки",
          values: [
            "90.8%",
            "98.2%",
            "105.6%",
            "116.2%",
            "123.6%",
            "132.0%",
            "143.6%",
            "155.2%",
            "166.8%",
            "179.5%",
            "192.2%",
            "204.9%",
            "217.5%",
          ],
        },
        {
          label: "Расход выносливости (CA)",
          values: Array(13).fill("25"),
        },
        {
          label: "Урон в падении",
          values: [
            "63.9%",
            "69.1%",
            "74.3%",
            "81.8%",
            "87.0%",
            "92.9%",
            "101.1%",
            "109.3%",
            "117.5%",
            "126.4%",
            "135.3%",
            "144.2%",
            "153.1%",
          ],
        },
        {
          label: "Низкий / высокий удар",
          values: [
            "127.8% / 159.7%",
            "138.2% / 172.7%",
            "148.6% / 185.7%",
            "163.5% / 204.2%",
            "173.9% / 217.2%",
            "185.8% / 232.1%",
            "202.2% / 252.5%",
            "218.5% / 272.9%",
            "234.9% / 293.4%",
            "252.7% / 315.6%",
            "270.5% / 337.9%",
            "288.4% / 360.2%",
            "306.2% / 382.5%",
          ],
        },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Все превращается в прах",
      icon: `${iconBase}/skill.png`,
      description:
        "Призывает **Кровавый огонь**, нанося **Пиро** по площади и выполняя рывок-рассечение. На противников накладывается **Директива долга** (урон Пиро каждые 5 сек., до 2 раз).\n\n**Поглощение директив** заряженной атакой или **Q** даёт **Долг жизни** (до 145% HP за 35 сек. после Е). Откат — **30 сек.**",
      loreText: "Не каждое зерно станет колосом — но пепел питает цветы.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон шипа",
          values: [
            "14.8%",
            "16.0%",
            "17.1%",
            "18.6%",
            "19.7%",
            "20.8%",
            "22.3%",
            "23.7%",
            "25.2%",
            "26.7%",
            "28.2%",
            "29.7%",
            "31.5%",
          ],
        },
        {
          label: "Урон рассечения",
          values: [
            "133.6%",
            "143.6%",
            "153.6%",
            "167.0%",
            "177.0%",
            "187.0%",
            "200.3%",
            "213.7%",
            "227.1%",
            "240.4%",
            "253.8%",
            "267.1%",
            "283.8%",
          ],
        },
        {
          label: "Урон директивы",
          values: [
            "31.8%",
            "34.2%",
            "36.6%",
            "39.8%",
            "42.1%",
            "44.5%",
            "47.7%",
            "50.9%",
            "54.1%",
            "57.2%",
            "60.4%",
            "63.6%",
            "67.6%",
          ],
        },
        {
          label: "Время отката",
          values: Array(13).fill("30 сек."),
        },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Восхождение роковой луны",
      icon: `${iconBase}/burst.png`,
      description:
        "Поглощает директивы вокруг, наносит **AoE Пиро**, **сбрасывает откат Е** и **лечит** от значения Долга жизни и АТК.\n\nЭнергия **60**. Откат **15 сек.**",
      loreText: "Багровая луна — не примет, а предвестие.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон навыка",
          values: [
            "370.4%",
            "398.2%",
            "426.0%",
            "463.0%",
            "490.8%",
            "518.6%",
            "555.6%",
            "592.6%",
            "629.7%",
            "666.7%",
            "703.8%",
            "740.8%",
            "787.1%",
          ],
        },
        {
          label: "Лечение",
          values: Array(13).fill("150% Долга + 150% АТК"),
        },
        {
          label: "Потребление энергии",
          values: Array(13).fill("60"),
        },
        {
          label: "Время отката",
          values: Array(13).fill("15 сек."),
        },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Лишь страдания искупят",
      icon: `${iconBase}/passive1.png`,
      description:
        "При убийстве цели с **Директивой** — **Долг жизни** 130% HP. Через 5 сек. директива становится **«Долгом»**; при поглощении — также 130% HP. Не превышает лимит от **Е**.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Лишь сила защитит",
      icon: `${iconBase}/passive2.png`,
      description:
        "+1% ко **всем** элементальным и физическим резистам за каждые **100** АТК сверх **1000** (макс. **20%** каждого).",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Лишь пепел насытит",
      icon: `${iconBase}/passive3.png`,
      description:
        "В бою +40% **Пиро DMG**; лечится **только** через **Восхождение роковой луны**.",
      order: 5,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Все возмездия и повинности понесу я…",
      icon: `${cIconBase}/c1.png`,
      description:
        "«Маска алой смерти» усилена ещё на **100%**; при обычных и заряженных атаках в этом режиме — повышенное **сопротивление прерыванию**.",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "За добрые деяния и прегрешения воздам я…",
      icon: `${cIconBase}/c2.png`,
      description:
        "Директивы сразу становятся **«Долгом»**. При поглощении — **900%** АТК AoE Пиро и **+20%** ко всем резистам на **15 сек.** (раз в **10 сек.**). Требует пассивку «Лишь страдания искупят».",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Ты станешь новым членом нашей семьи…",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень **Приглашение на казнь** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Впредь любите и защищайте друг друга…",
      icon: `${cIconBase}/c4.png`,
      description:
        "При поглощении директивы откат **Восхождения роковой луны** −**2 сек.** и **+15** энергии (раз в **10 сек.**).",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "По одиночке мы все равно что мертвы",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень **Восхождение роковой луны** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Возрадуемся новой жизни вместе",
      icon: `${cIconBase}/c6.png`,
      description:
        "Урон **Q** + АТК × **700%** текущего % Долга жизни. После **Е** на **20 сек.** NA и Q получают **+10%** К/Ш и **+70%** К/У (раз в **15 сек.**).",
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
        element: Element.PYRO,
        weaponType: "Копьё",
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
        element: Element.PYRO,
        weaponType: "Копьё",
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
