/**
 * Импорт гайда на Николь.
 *
 *   npx tsx scripts/seed-nikol-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Николь уже корректные иконки в БД.
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

const NAME = "Николь";
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

type TalentValues = {
  na: string[][];
  sk: string[][];
  bu: string[][];
};

/** Хардкод из scripts/_tmp-nikol-talent-values.json */
function loadTalentValues(): TalentValues {
  return {
    na: [
      ["35.2%", "37.8%", "40.5%", "44%", "46.6%", "49.3%", "52.8%", "56.3%", "59.8%", "63.3%", "66.8%", "70.4%", "74.8%"],
      ["29.6%", "31.9%", "34.1%", "37%", "39.3%", "41.5%", "44.5%", "47.4%", "50.4%", "53.3%", "56.3%", "59.3%", "63%"],
      ["46.2%", "49.7%", "53.1%", "57.7%", "61.2%", "64.7%", "69.3%", "73.9%", "78.5%", "83.1%", "87.8%", "92.4%", "98.1%"],
      ["112.3%", "120.7%", "129.2%", "140.4%", "148.8%", "157.2%", "168.5%", "179.7%", "190.9%", "202.2%", "213.4%", "224.6%", "238.7%"],
      ["50", "50", "50", "50", "50", "50", "50", "50", "50", "50", "50", "50", "50"],
      ["56.8%", "61.5%", "66.1%", "72.7%", "77.3%", "82.6%", "89.9%", "97.1%", "104.4%", "112.3%", "120.3%", "128.2%", "136.1%"],
      [
        "113.6% / 141.9%",
        "122.9% / 153.5%",
        "132.1% / 165%",
        "145.3% / 181.5%",
        "154.6% / 193.1%",
        "165.2% / 206.3%",
        "179.7% / 224.5%",
        "194.2% / 242.6%",
        "208.8% / 260.8%",
        "224.6% / 280.6%",
        "240.5% / 300.4%",
        "256.3% / 320.2%",
        "272.2% / 340%",
      ],
    ],
    sk: [
      ["138.4%", "148.8%", "159.2%", "173%", "183.4%", "193.8%", "207.6%", "221.4%", "235.3%", "249.1%", "263%", "276.8%", "294.1%"],
      [
        "221.2% АТК + 1387",
        "237.8% АТК + 1525",
        "254.4% АТК + 1676",
        "276.5% АТК + 1837",
        "293.1% АТК + 2011",
        "309.7% АТК + 2196",
        "331.8% АТК + 2392",
        "353.9% АТК + 2600",
        "376% АТК + 2820",
        "398.1% АТК + 3051",
        "420.2% АТК + 3294",
        "442.4% АТК + 3548",
        "470% АТК + 3814",
      ],
      Array(13).fill("20 сек."),
      [
        "8.25% АТК",
        "9% АТК",
        "9.75% АТК",
        "10.5% АТК",
        "11.25% АТК",
        "12% АТК",
        "12.75% АТК",
        "13.5% АТК",
        "14.25% АТК",
        "15% АТК",
        "15.9% АТК",
        "16.8% АТК",
        "17.7% АТК",
      ],
      ["330", "360", "390", "420", "450", "480", "510", "540", "570", "600", "636", "672", "708"],
      Array(13).fill("20 сек."),
      Array(13).fill("16 сек."),
    ],
    bu: [
      ["316.8%", "340.6%", "364.3%", "396%", "419.8%", "443.5%", "475.2%", "506.9%", "538.6%", "570.2%", "601.9%", "633.6%", "673.2%"],
      [
        "99% АТК активного",
        "108% АТК активного",
        "117% АТК активного",
        "126% АТК активного",
        "135% АТК активного",
        "144% АТК активного",
        "153% АТК активного",
        "162% АТК активного",
        "171% АТК активного",
        "180% АТК активного",
        "190.8% АТК активного",
        "201.6% АТК активного",
        "212.4% АТК активного",
      ],
      Array(13).fill("4"),
      Array(13).fill("20 сек."),
      Array(13).fill("15 сек."),
      Array(13).fill("60"),
    ],
  };
}

async function main() {
  const existing = await prisma.character.findFirst({
    where: {
      OR: [
        { slug: "nikol" },
        { name: "Николь" },
        { name: { contains: "Никол" } },
        { name: { contains: "никол" } },
      ],
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

  const SLUG = existing?.slug || "nikol";
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

  const artDarNebes = a("Дар небес");
  const artNoblesse = a("Церемония древней знати");
  const artGlad = a("Конец гладиатора");
  const artShimenawa = a("Воспоминания Симэнавы", "Воспоминания Шимэнавы");
  const artVermillion = a("Киноварное загробье");

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
      w("Гептада ангела"),
      1,
      "Гептада ангела",
      "Сигна",
      "Много АТК; после щита — бафф урона активного от АТК носителя и энергия. При Тайном обряде часть баффа идёт Ведьмовским из кармана.",
      "Лучший выбор: АТК, бафф отряду и энергия при создании щита.",
      "S",
    ),
    rankedWeapon(
      w("Звонкий клич журавля"),
      2,
      "Звонкий клич журавля",
      "Только статы",
      "Высокая база и АТК%; пассивка на планж почти не используется.",
      "Сильные статы без сигны; пассивку можно игнорировать.",
      "A",
    ),
    rankedWeapon(
      w("Небесный атлас"),
      3,
      "Небесный атлас",
      "Стандарт · АТК%",
      "Высокая база и АТК%; пассивка бьёт физ. уроном и почти бесполезна.",
      "Стабильная легендарка из стандарта ради статов.",
      "A",
    ),
    rankedWeapon(
      w("Память о пыли"),
      4,
      "Память о пыли",
      "Щит · АТК",
      "Усиливает щит и копит АТК при попаданиях; под щитом бонус удваивается.",
      "Сильный Пиро-щитовик: АТК и плотность щита. Перед ротацией 2–3 удара с руки.",
      "A",
    ),
    rankedWeapon(
      w("Око клятвы"),
      5,
      "Око клятвы",
      "Лучший 4★",
      "После Е — бонус ВЭ на короткое время.",
      "Лучший эпик: АТК + быстрее ульта и проекции.",
      "A",
    ),
    rankedWeapon(
      w("Кодекс Фавония"),
      6,
      "Кодекс Фавония",
      "ВЭ · батарея",
      "Крит. попадания генерируют частицы энергии.",
      "Снимает нужду в ВЭ%; добирайте АТК в артефактах. Батарея отряду.",
      "B",
    ),
    rankedWeapon(
      w("Сверкание чистых вод"),
      7,
      "Сверкание чистых вод",
      "Крафт · АТК%",
      "АТК% в саб-стате; пассивка на бонус урона почти не нужна саппорту.",
      "F2P-крафт ради АТК, пока нет лучшего катализатора.",
      "B",
    ),
    rankedWeapon(
      w("Плод вечной мерзлоты"),
      8,
      "Плод вечной мерзлоты",
      "АТК% · временный",
      "Высокий АТК%; пассивка на НА/заряженные почти не играет.",
      "Только статы до эпика/легендарки.",
      "C",
    ),
    rankedWeapon(
      w("Око сознания"),
      9,
      "Око сознания",
      "АТК% · временный",
      "Много АТК%; пассивка на обычные удары не приоритетна.",
      "Временный вариант ради саб-стата.",
      "C",
    ),
    rankedWeapon(
      w("Эпос о драконоборцах"),
      10,
      "Эпос о драконоборцах",
      "Бюджет · бафф союзнику",
      "При смене персонажа баффает АТК вошедшего; низкая база и HP-стат слабы для личной АТК Николь.",
      "Слабый личный АТК; редко перекрывает потерю баффа Благодати. Временный бюджет.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artDarNebes,
      1,
      "Дар небес",
      "Лучший 4п",
      "2п +20% ВЭ; 4п — бафф элем. урона союзникам после Е; при Тайном обряде усиление растёт.",
      "Сигнатурный сет: энергия ульты и бафф стихии отряду, особенно с Дурином и Шабашем.",
      "S",
    ),
    rankedArt(
      artNoblesse,
      2,
      "Церемония древней знати",
      "Без резонанса Шабаша",
      "4п: после ульты +20% АТК отряду на 12 сек. (не стакается).",
      "Если нет Ведьмовства / не закрываете Дар небес — рабочий саппортский сет. Один носитель в отряде.",
      "A",
    ),
    rankedArt(
      artGlad || artShimenawa || artVermillion,
      3,
      "2п АТК + 2п АТК",
      "Временный 2+2",
      "2п Конец гладиатора / Симэнава / Киноварное загробье (+18% АТК каждый).",
      "Пока нет 4п Дара/Знати — упрощает добор АТК без командного баффа.",
      "B",
    ),
  ];
  if (artItems[2]) {
    artItems[2].name = "2п Конец гладиатора / Симэнава / Киноварное загробье";
  }

  const matWorn = m("Потрёпанный мандат", "Потрепанный мандат");
  const matFine = m("Безупречный мандат");
  const matFrost = m("Заиндевевший мандат");
  const matBook1 = m("Учения о «Рае»");
  const matBook2 = m("Указания о «Рае»");
  const matBook3 = m("Философия о «Рае»");
  const matAgate1 = m("Осколок агата Агнидус", "Осколок агата");
  const matAgate2 = m("Фрагмент агата Агнидус", "Фрагмент агата");
  const matAgate3 = m("Кусок агата Агнидус", "Кусок агата");
  const matAgate4 = m("Драгоценный агат Агнидус", "Драгоценный агат");
  const matWing = m("Останки крыла ужаса");
  const matAmber = m("Сосновый янтарь");
  const matResin = m("Поддельная смола");
  const matCrown = m("Корона прозрения");

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Николь",
      body: `Николь — **Пиро катализатор 5★**, ангел и ведьма **Ведьминого шабаша**. Роль — **саппорт-щитовик и баффер АТК**: даёт **Щит пылающего сияния**, **Благодать кенозиса** / **Наставление теозиса** и координированные **Проекции священного таинства**, которые бьют **элементом и уроном активного персонажа**.

### Кратко
- **Рейтинг** — S+
- **Стихия / оружие** — Пиро · катализатор
- **Возвышение** — АТК% (**+28.8%** на 90 ур.)
- **База на 90 ур.** — HP **10 409** · АТК **342** · Защита **563** · бонус АТК **28.8%**
- **Добавлена** — патч **6.6**; сигна — **Гептада ангела**
- **День рождения** — 29 сентября
- **Получение** — молитва события «Грёзы ангела»
- **Регион / фракция** — Неизвестно · Ведьмин шабаш
- **Созвездие** — Золотой Ларец
- **Особое блюдо** — **Позолоченный сундук**
- **Именная карточка** — **Дворцовая лестница**`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "**Простая сборка** — почти нет личного урона; достаточно АТК и ВЭ%, криты не нужны.",
        "Сильный саппорт: щит + бафф АТК всему отряду — **легендарная альтернатива Беннету**.",
        "**Проекции** бьют дамагом активного персонажа и его стихией; не мешают реакциям.",
        "Пассивка **Непсис** упрощает исследование мира (фея / компас сокровищ региона).",
      ],
      cons: [
        "Полностью раскрывается в **Ведьминском** отряде (резонанс / Тайный обряд); без него урон проекций слабее.",
        "Слабо подходит союзникам от **HP / МС / защиты** — бафф только АТК.",
        "С «обычным» (не Ведьмовским) мейн-дд проекции слабые; иногда выгоднее не тратить Q.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Николь",
      body: `Сборка под **щит**, **бафф АТК** и комфортную **ульту**. Криты в артефактах и оружии не нужны. Приоритет: **АТК → ВЭ%**. Пески — **АТК%** или **ВЭ%**; кубок — **АТК%**; корона — **АТК%**. В сабах: **АТК% · ВЭ% · плоская АТК**.

Для максимума баффа на 10 ур. навыка цель — **4000+ АТК**. ВЭ — **140–180%** (ниже с Пиро-резонансом и Фавонией).`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Порог **4000 АТК** закрывает максимум Благодати на 10 ур. Е; ВЭ — под ульту по откату.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "4000+",
          hint: "Макс. бафф Благодати на 10 ур. навыка; сильна помогает сигна",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "140–180%",
          hint: "Ниже с Пиро-резонансом и Фавонией; выше в соло-энергетике",
        },
        {
          id: uid(),
          label: "Криты",
          value: "не нужны",
          hint: "Личный урон минимален; не тратьте сабы на К/Ш и К/У",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК% / ВЭ%", subs: "АТК% · ВЭ% · плоская АТК" },
        { id: uid(), slot: "Кубок", main: "АТК%", subs: "АТК% · ВЭ% · плоская АТК" },
        { id: uid(), slot: "Корона", main: "АТК%", subs: "АТК% · ВЭ% · плоская АТК" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите **АТК** (база и %) и полезные саппортские пассивки. Лучший 4★ — **Око клятвы**. Фавоний — если нужна батарея и ВЭ.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель почти всегда — **Дар небес**. Без резонанса Шабаша — **Церемония древней знати**. Пока нет 4п — **2+2 на АТК**.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в Ведьминском отряде",
      intro: "Ориентир: **Дар небес** на Николь в командах с Тайным обрядом / несколькими Ведьмовскими.",
      groups: [
        {
          id: uid(),
          title: "Ведьмин шабаш",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Дар небес",
              setImage: artImg(artDarNebes, "Дар небес"),
            },
            planRow(
              c("durin", "дурин"),
              "Дурин",
              "Свой сет / флекс",
              "",
            ),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Ведьмин шабаш и АТК-дд",
      body: `Лучше всего Николь играет с **Ведьмовскими** героями (**Варка, Дурин, Лоэн, Кли, Прюн, Мона, Венти, Фишль, Альбедо, Рэйзор, Сахароза** и др.): так закрываются пассивки и **Тайный обряд**. Без резонанса падает в основном урон **проекций**, а бафф АТК остаётся.

Мейн-дд желательно держать на поле **≥3 сек.** (или сразу, если он Ведьмовской), иначе **Наставление теозиса** не успеет включиться.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Николь:",
      rows: [
        roleRow(
          c("varka", "варка"),
          "Варка",
          "Двуручный меч",
          "Лучший мейн-дд под Николь: Ведьмовство, бафф АТК и срез RES к стихиям, которыми он бьёт.",
        ),
        roleRow(
          c("durin", "дурин"),
          "Дурин",
          "Меч",
          "Закрывает Ведьмовство и Пиро-резонанс; саб-урон и баффы. Универсальный партнёр почти в любой пачке.",
        ),
        roleRow(
          c("loen", "лоэн"),
          "Лоэн",
          "Копьё",
          "Крио-дд от стойки и обычных; нуждается в резонансе Шабаша и копит стаки от Проекций.",
        ),
        roleRow(
          c("klee", "кли"),
          "Кли",
          "Катализатор",
          "Ведьмовской Пиро-мейн от НА/заряженных; в ульте не свапает — нужен сильный карманный саппорт.",
        ),
        roleRow(
          c("kinich", "кинич"),
          "Кинич",
          "Двуручный меч",
          "Не из Шабаша, но отлично синергирует: щит удобнее поля Беннета при мобильном геймплее.",
        ),
        roleRow(
          c("mona", "мона"),
          "Мона",
          "Катализатор",
          "Сильный Гидро-мейн под Пар; Омен и проекции хорошо масштабируются от АТК.",
        ),
        roleRow(
          c("venti", "венти"),
          "Венти",
          "Лук",
          "Анемо саб / потенциальный драйвер; бафф Николь не привязан к кругу — удобно с стяжкой.",
        ),
        roleRow(
          c("fischl", "фишль"),
          "Фишль",
          "Лук",
          "Стабильный Электро из кармана в Перегрузке; связка с Дурином и Николь очень сильна.",
        ),
        roleRow(
          c("pryun", "прюн"),
          "Прюн",
          "Катализатор",
          "Ведьмовской Анемо-саппорт; особенно сильна с Анемо-мейн-дд вроде Варки.",
        ),
        roleRow(
          c("sucrose", "сахароза"),
          "Сахароза",
          "Катализатор",
          "Ведьмовской Анемо-саппорт со стяжкой; удобна в Таянии и Паре.",
        ),
      ],
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Варианты от топа к бюджету:",
      variants: [
        variant(
          "Топ рассеивание: Варка + Дурин; Прюн или Венти на Анемо-саппорт.",
          [
            member(c("varka", "варка"), "Варка", "Мейн-дд"),
            member(c("durin", "дурин"), "Дурин", "Саб / Пиро"),
            member(c("pryun", "прюн") || c("venti", "венти"), "Прюн / Венти", "Анемо"),
            self("Щит / бафф"),
          ],
          "Топ",
        ),
        variant(
          "Бюджет Варка: Сян Лин + Фарузан вместо Дурина и Прюн.",
          [
            member(c("varka", "варка"), "Варка", "Мейн-дд"),
            member(c("xiangling", "сян лин"), "Сян Лин", "Пиро"),
            member(c("faruzan", "фарузан"), "Фарузан", "Анемо"),
            self("Щит / бафф"),
          ],
          "Бюджет",
        ),
        variant(
          "Странник с Дурином; Прюн или Фарузан на Анемо-бафф.",
          [
            member(c("strannik", "странник"), "Странник", "Мейн-дд"),
            member(c("durin", "дурин"), "Дурин", "Саб / Пиро"),
            member(c("pryun", "прюн") || c("faruzan", "фарузан"), "Прюн / Фарузан", "Анемо"),
            self("Щит / бафф"),
          ],
          "Альтернатива",
        ),
        variant(
          "Перегрузка: Арлекино или Кли; Дурин или Шеврёз; Фишль.",
          [
            member(c("arlekino", "арлекино") || c("klee", "кли"), "Арлекино / Кли", "Мейн-дд"),
            member(c("durin", "дурин") || c("shevryez", "шеврёз"), "Дурин / Шеврёз", "Пиро"),
            member(c("fischl", "фишль"), "Фишль", "Электро"),
            self("Щит / бафф"),
          ],
          "Топ",
        ),
        variant(
          "Перегрузка с Электро-мейн: Клоринда или Вареса; Дурин/Шеврёз + Фишль.",
          [
            member(c("klorinda", "клоринда") || c("varesa", "вареса"), "Клоринда / Вареса", "Мейн-дд"),
            member(c("durin", "дурин") || c("shevryez", "шеврёз"), "Дурин / Шеврёз", "Пиро"),
            member(c("fischl", "фишль"), "Фишль", "Электро"),
            self("Щит / бафф"),
          ],
          "Альтернатива",
        ),
        variant(
          "Пар: Пиро-мейн + Е Лань/Син Цю + Мона.",
          [
            member(
              c("arlekino", "арлекино") || c("hutao", "ху тао") || c("yoimiya", "ёимия"),
              "Арлекино / Ху Тао / Ёимия",
              "Мейн-дд",
            ),
            member(c("yelan", "е лань") || c("xingqiu", "син цю"), "Е Лань / Син Цю", "Гидро"),
            member(c("mona", "мона"), "Мона", "Гидро / бафф"),
            self("Щит / бафф"),
          ],
          "Топ",
        ),
        variant(
          "Пар от Моны: Мавуика/Дурин/Сян Лин + Сахароза/Венти.",
          [
            member(c("mona", "мона"), "Мона", "Мейн-дд"),
            member(
              c("mavuika", "мавуика") || c("durin", "дурин") || c("xiangling", "сян лин"),
              "Мавуика / Дурин / Сян Лин",
              "Пиро",
            ),
            member(c("sucrose", "сахароза") || c("venti", "венти"), "Сахароза / Венти", "Анемо"),
            self("Щит / бафф"),
          ],
          "Топ",
        ),
        variant(
          "Таяние: Лоэн или Ризли + Дурин + Сахароза/Венти.",
          [
            member(c("loen", "лоэн") || c("wriothesley", "ризли"), "Лоэн / Ризли", "Мейн-дд"),
            member(c("durin", "дурин"), "Дурин", "Пиро"),
            member(c("sucrose", "сахароза") || c("venti", "венти"), "Сахароза / Венти", "Анемо"),
            self("Щит / бафф"),
          ],
          "Топ",
        ),
        variant(
          "Горение: Кинич + Эмилия/Иансан + Дурин.",
          [
            member(c("kinich", "кинич"), "Кинич", "Мейн-дд"),
            member(c("emiliya", "эмилия") || c("iansan", "иансан"), "Эмилия / Иансан", "Саб / бафф"),
            member(c("durin", "дурин"), "Дурин", "Пиро"),
            self("Щит / бафф"),
          ],
          "Альтернатива",
        ),
        variant(
          "Моно-Пиро: Кли или Лини + Дурин + Сахароза/Шилонен.",
          [
            member(c("klee", "кли") || c("lini", "лини"), "Кли / Лини", "Мейн-дд"),
            member(c("durin", "дурин"), "Дурин", "Пиро"),
            member(c("sucrose", "сахароза") || c("shilonen", "шилонен"), "Сахароза / Шилонен", "Бафф / срез"),
            self("Щит / бафф"),
          ],
          "Альтернатива",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Николь (агат Агнидус + материалы Нод-Края):",
      rows: [
        {
          id: uid(),
          name: matAgate1?.name || "Агат Агнидус",
          image: matAgate1?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия агата Агнидус)",
          href: matAgate1 ? `/wiki/materials/${matAgate1.slug}` : undefined,
        },
        {
          id: uid(),
          name: (() => {
            if (!matWorn) noteMissing("material", "Потрёпанный мандат");
            if (!matFine) noteMissing("material", "Безупречный мандат");
            return matFrost?.name || "Мандаты";
          })(),
          image: matFrost?.image || "",
          qty: "18 / 30 / 36",
          where: "Опричники Фатуи (Потрёпанный / Безупречный / Заиндевевший мандат)",
          href: matFrost ? `/wiki/materials/${matFrost.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWing?.name || "Останки крыла ужаса",
          image: matWing?.image || "",
          qty: "46",
          where: "Мировой босс (Останки крыла ужаса)",
          href: matWing ? `/wiki/materials/${matWing.slug}` : undefined,
        },
        {
          id: uid(),
          name: matAmber?.name || "Сосновый янтарь",
          image: matAmber?.image || "",
          qty: "168",
          where: "Диковинка (Сосновый янтарь)",
          href: matAmber ? `/wiki/materials/${matAmber.slug}` : undefined,
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
          name: matBook1?.name || "Учения о «Рае»",
          image: matBook1?.image || "",
          rarity: 4 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Рае»",
          image: matBook2?.image || "",
          rarity: 4 as const,
          note: "×21",
          qty: "21",
          href: matBook2 ? `/wiki/materials/${matBook2.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook3?.name || "Философия о «Рае»",
          image: matBook3?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: matBook3 ? `/wiki/materials/${matBook3.slug}` : undefined,
        },
        {
          id: uid(),
          name: matWorn?.name || "Потрёпанный мандат",
          image: matWorn?.image || "",
          rarity: 2 as const,
          note: "×6",
          qty: "6",
          href: matWorn ? `/wiki/materials/${matWorn.slug}` : undefined,
        },
        {
          id: uid(),
          name: matFine?.name || "Безупречный мандат",
          image: matFine?.image || "",
          rarity: 3 as const,
          note: "×21",
          qty: "21",
          href: matFine ? `/wiki/materials/${matFine.slug}` : undefined,
        },
        {
          id: uid(),
          name: matFrost?.name || "Заиндевевший мандат",
          image: matFrost?.image || "",
          rarity: 4 as const,
          note: "×31",
          qty: "31",
          href: matFrost ? `/wiki/materials/${matFrost.slug}` : undefined,
        },
        {
          id: uid(),
          name: matResin?.name || "Поддельная смола",
          image: matResin?.image || "",
          rarity: 5 as const,
          note: "×4",
          qty: "4",
          href: matResin ? `/wiki/materials/${matResin.slug}` : undefined,
        },
        {
          id: uid(),
          name: matCrown?.name || "Корона прозрения",
          image: matCrown?.image || "",
          rarity: 5 as const,
          note: "×1",
          qty: "1",
          href: matCrown ? `/wiki/materials/${matCrown.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Характеристики при возвышении",
      intro:
        "Растёт **АТК%** (**+28.8%** на 90 ур.). Качайте хотя бы до **80/90** — от АТК зависят щит и бафф.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "Бонус АТК (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "810", "27", "44", "5%", "0%"),
        emptyStatsRow("20", "2 102", "69", "114", "5%", "0%"),
        emptyStatsRow("40", "4 185", "138", "226", "5%", "0%"),
        emptyStatsRow("50", "5 383", "177", "291", "5%", "7.2%"),
        emptyStatsRow("60", "6 752", "222", "365", "5%", "14.4%"),
        emptyStatsRow("70", "7 964", "262", "430", "5%", "14.4%"),
        emptyStatsRow("80", "9 184", "302", "496", "5%", "21.6%"),
        emptyStatsRow("90", "10 409", "342", "563", "5%", "28.8%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Николь — **Пиро саппорт**: щит, бафф АТК и координированные **Проекции**. Личного Пиро-статуса почти нет; проекции бьют стихией активного героя и считаются его уроном.

### Приоритет прокачки
**Е > Q > обычные** (обычные опциональны).

### Активные навыки
- **Аллегория** — до 3 ударов катализатором; заряженная бьёт по площади; удар в падении — Пиро по области.
- **Откровение: Несотворенный свет (Е)** — Пиро по площади, **Благодать кенозиса** союзникам и **Щит пылающего сияния** (поглощение от АТК, Пиро поглощается эффективнее). При условиях **Метексиса** Благодать → **Наставление теозиса**. Откат **16** сек., длительность щита/благодати **20**.
- **Откровение: Лествица Божественного восхождения (Q)** — Пиро по площади и режим **Созерцательной молитвы**: при ударах активного раз в **3** сек. (до **4** раз) вызывается **Проекция священного таинства** — совместная атака стихией активного от его АТК. **60** энергии, откат **15**, длительность **20**.

### Пассивки
- **Метексис** — 20 сек. после Е «наблюдает» активного: через **3** сек. на поле Благодать → Наставление (+**300** АТК). Ведьмовской активный получает Наставление сразу. При уходе с поля у других Наставление снова становится Благодатью.
- **Филокалия** — когда элем. урон активного рядом попадает по врагу, Благодать самой Николь на **8** сек. → Наставление.
- **Непсис** — вне боя при наличии компаса региона заряженная становится Путеводным посланником (фея / эффект компаса); откат **5** сек.; не в подземельях и Бездне.
- **Ведьмин ритуал кануна: Свет во тьме** — после уроков ведьмы Николь — Ведьмовской персонаж; при ≥2 Ведьмовских в отряде — **Ведьмовство: Тайный обряд**: урон Проекций Ведьмовских +**300%** АТК Николь.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. **Е** — щит и Благодать кенозиса.
2. **Q** — Созерцательная молитва и проекции.
3. Саппорты / саб-дд — свои навыки.
4. Мейн-дд: если **не** Ведьмовской — подождите **3 сек.** до Наставления теозиса, затем ключевые удары.
5. Обновляйте Е и Q по откату.

> Порядок: **Е → Q → саппорты → мейн-дд (ждать 3 сек., если не Ведьмовский) → обновлять по откату**.

### Стоит ли выбивать?
**S+** саппорт: щит + сильный бафф АТК всему отряду, конкурент и замена **Беннету**. С **Дурином** усиливает почти любой старый АТК-отряд. Сборка и ротация простые; учитывайте задержку Наставления для «обычных» мейн-дд.

### С1 или сигна?
- **Сигна (Гептада ангела)** важнее **С1**: проще набрать **4000 АТК** и командный бафф.
- **С2** сильнее сигны: доп. АТК к Благодати, срез RES и щит союзникам при Е.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `Николь Рейн — провидица, выжившая ангел и представительница **Ведьминого шабаша** (кодовое имя «Н»). Давно лишилась голоса и говорит лишь в умах людей, наставляя заблудших. Созвездие **Золотой Ларец**, особое блюдо **Позолоченный сундук** и именная карточка **Дворцовая лестница** подчёркивают образ «ангела-проводника».`,
    },
  ];

  if (!matBook1) noteMissing("material", "Учения о «Рае»");
  if (!matBook2) noteMissing("material", "Указания о «Рае»");
  if (!matBook3) noteMissing("material", "Философия о «Рае»");
  if (!matResin) noteMissing("material", "Поддельная смола");

  const levelMaterials: CharacterMaterial[] = [
    matCard(matAmber, "Сосновый янтарь", 168, "local", 1),
    matCard(matWing, "Останки крыла ужаса", 46, "boss", 4),
    matCard(matAgate1, "Осколок агата Агнидус", 1, "ascension", 2),
    matCard(matAgate2, "Фрагмент агата Агнидус", 9, "ascension", 3),
    matCard(matAgate3, "Кусок агата Агнидус", 9, "ascension", 4),
    matCard(matAgate4, "Драгоценный агат Агнидус", 6, "ascension", 5),
    matCard(matWorn, "Потрёпанный мандат", 18, "ascension", 1),
    matCard(matFine, "Безупречный мандат", 30, "ascension", 2),
    matCard(matFrost, "Заиндевевший мандат", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Рае»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Рае»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Рае»", 114, "talent", 4),
    matCard(matResin, "Поддельная смола", 12, "talent", 5),
    matCard(matCrown, "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Николь — Пиро саппорт-щитовик и баффер АТК: билд, оружие, сеты и отряды.";

  const iconBase = "/images/talents/nikol";
  const cIconBase = "/images/constellations/nikol";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));
  const tv = loadTalentValues();

  const talents = [
    {
      id: "t_na",
      name: "Аллегория",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до трёх последовательных ударов катализатором, наносящих **Пиро урон**.\n\n**Заряженная:** тратит выносливость и наносит **Пиро урон** по небольшой площади.\n\n**Удар в падении:** Пиро урон по области при приземлении.",
      loreText: "Аллегория начертана светом.",
      levelLabels: lv13,
      stats: [
        { label: "Урон 1 удара", values: tv.na[0] },
        { label: "Урон 2 удара", values: tv.na[1] },
        { label: "Урон 3 удара", values: tv.na[2] },
        { label: "Урон заряженной", values: tv.na[3] },
        { label: "Расход выносливости", values: tv.na[4] },
        { label: "Урон в падении", values: tv.na[5] },
        { label: "Низкий / высокий удар", values: tv.na[6] },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Откровение: Несотворенный свет",
      icon: `${iconBase}/skill.png`,
      description:
        "Воссоздаёт мимолётный отблеск эпохи, когда ангелы действовали властью небес: накладывает на союзников рядом **Благодать кенозиса**, наносит **Пиро урон** по площади и создаёт **Щит пылающего сияния**.\n\nПоглощение щита зависит от АТК Николь; **Пиро урон** поглощается с эффективностью **250%**.\n\n**Благодать кенозиса** повышает силу атаки союзников от АТК Николь. При условиях пассивки **Метексис** эффект усиливается до **Наставления теозиса**.",
      loreText: "Несотворённый свет ведёт стезю.",
      levelLabels: lv13,
      stats: [
        { label: "Урон навыка", values: tv.sk[0] },
        { label: "Поглощение щита", values: tv.sk[1] },
        { label: "Длительность щита", values: tv.sk[2] },
        { label: "Бонус АТК Благодати кенозиса", values: tv.sk[3] },
        { label: "Макс. бонус АТК Благодати", values: tv.sk[4] },
        { label: "Длительность Благодати", values: tv.sk[5] },
        { label: "Время отката", values: tv.sk[6] },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Откровение: Лествица Божественного восхождения",
      icon: `${iconBase}/burst.png`,
      description:
        "Николь плетёт путь судьбы золотыми нитями света: наносит **Пиро урон** по площади и входит в режим **Созерцательной молитвы**.\n\nПока режим активен, когда активный персонаж отряда рядом поражает противника, вызывается **Проекция священного таинства** — совместная атака с элем. уроном по площади **стихии этого персонажа**. Урон масштабируется от АТК активного и считается его уроном.\n\nСрабатывает раз в **3 сек.**, до **4** раз за одно вхождение в Созерцательную молитву.\n\nПроекции Ведьмовских персонажей выглядят иначе.",
      loreText: "Лествица восхождения открыта.",
      levelLabels: lv13,
      stats: [
        { label: "Урон навыка", values: tv.bu[0] },
        { label: "Урон Проекции священного таинства", values: tv.bu[1] },
        { label: "Число атак проекции", values: tv.bu[2] },
        { label: "Длительность Созерцательной молитвы", values: tv.bu[3] },
        { label: "Время отката", values: tv.bu[4] },
        { label: "Потребление энергии", values: tv.bu[5] },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Метексис",
      icon: `${iconBase}/passive1.png`,
      description:
        "В течение **20 сек.** после **Откровение: Несотворенный свет** Николь ведёт наблюдение за другими активными персонажами отряда. Если наблюдаемый непрерывно на поле **3 сек.**, его **Благодать кенозиса** улучшается до **Наставления теозиса** (+**300** АТК). Если наблюдаемый — **Ведьмовской**, улучшение происходит сразу.\n\nКогда другие персонажи (кроме Николь) с Наставлением теозиса уходят с поля, эффект снова становится Благодатью кенозиса.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Филокалия",
      icon: `${iconBase}/passive2.png`,
      description:
        "Когда элементальный урон активного персонажа отряда поблизости поражает противника, **Благодать кенозиса** самой Николь на **8 сек.** улучшается до **Наставления теозиса**.",
      order: 4,
    },
    {
      id: "t_util",
      name: "Непсис",
      icon: `${iconBase}/utility.png`,
      description:
        "Вне боя в Тейвате, если уже получен компас сокровищ текущего региона, заряженная атака Николь становится **Путеводным посланником**: призывает ближайшую фею и активирует эффект, аналогичный компасу региона.\n\nОткат **5 сек.** Не действует в подземельях, Подземельях наказания и Витой Бездне.",
      order: 5,
    },
    {
      id: "t_witch",
      name: "Ведьмин ритуал кануна: Свет во тьме",
      icon: `${iconBase}/passive3.png`,
      description:
        "После выполнения «Уроки ведьм: Роль наставника?..» Николь становится **Ведьмовским** персонажем. Если в отряде ≥**2** Ведьмовских, активируется **Ведьмовство: Тайный обряд**, усиливающий Ведьмовских героев.\n\n**Тайный обряд:** урон **Проекций священного таинства** Ведьмовских персонажей +**300%** силы атаки Николь.",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Не бойся, любимое дитя",
      icon: `${cIconBase}/c1.png`,
      description:
        "Когда атаки активного персонажа отряда поражают противника, дополнительно вызывается особая **Проекция священного таинства: Единство**: совместная атака с элем. уроном по площади стихии этого персонажа на **600%** его АТК; урон считается его собственным.\n\nСрабатывает раз в **6 сек.**",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "Я буду наставлять тебя и укажу путь",
      icon: `${cIconBase}/c2.png`,
      description:
        "Усиливает **Откровение: Несотворенный свет**: **Благодать кенозиса** дополнительно +**300** АТК (не входит в лимит бонуса), а **Наставление теозиса** снижает элем. RES врагов рядом по стихии персонажа на **25%** (не стакается для одной стихии).\n\nКроме того, при применении Е активные персонажи рядом также получают **Щит пылающего сияния**.",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Я стану твоим фонарём, путеводным светом",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень навыка **Откровение: Несотворенный свет** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Куда ты ни пойдёшь, влево или вправо.",
      icon: `${cIconBase}/c4.png`,
      description:
        "Когда **Благодать кенозиса** союзников рядом улучшается до **Наставления теозиса**, Николь на **20 сек.** даёт им **Путеводный оберег** (раз в **16 сек.** на персонажа).\n\nУрон обычной, заряженной, в падении, Е и Q персонажей с оберегом +**70%** АТК Николь. Снимается после **8** срабатываний или по истечении времени. При попадании по нескольким врагам расходуется по числу целей. Счётчик независим для каждого персонажа.",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "Рядом ты будешь слышать мой голос",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень навыка **Откровение: Лествица Божественного восхождения** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Не мешкай, это верный путь",
      icon: `${cIconBase}/c6.png`,
      description:
        "Когда **Благодать кенозиса** Николь улучшается до **Наставления теозиса**, Благодать всех союзников рядом также становится Наставлением и больше не откатывается обратно.\n\nКроме того, урон персонажей с **Наставлением теозиса** игнорирует **40%** защиты противников.",
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
        weaponType: "Катализатор",
        region: "Неизвестно",
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
        weaponType: "Катализатор",
        region: "Неизвестно",
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
