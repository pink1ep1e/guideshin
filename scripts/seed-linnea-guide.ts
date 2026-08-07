/**
 * Импорт гайда на Линнею.
 *
 *   npx tsx scripts/seed-linnea-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Линнеи уже корректные иконки в БД.
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

const NAME = "Линнея";
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
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.GEO;
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
    elementIcon: ELEMENT_SVG.GEO,
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
    elementIcon: ELEMENT_SVG.GEO,
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

function heal(defPct: string, flat: string): string {
  return `${defPct}% защиты + ${flat}`;
}

type TalentValues = {
  na: string[][];
  sk: string[][];
  bu: string[][];
};

function loadTalentValues(): TalentValues {
  return {
    na: [
      ["59%", "63.8%", "68.6%", "75.5%", "80.3%", "85.8%", "93.3%", "100.8%", "108.4%", "116.6%", "124.9%", "133.1%", "141.3%"],
      ["51.2%", "55.3%", "59.5%", "65.4%", "69.6%", "74.3%", "80.9%", "87.4%", "94%", "101.1%", "108.3%", "115.4%", "122.5%"],
      ["81.6%", "88.3%", "94.9%", "104.4%", "111.1%", "118.7%", "129.1%", "139.5%", "150%", "161.4%", "172.8%", "184.1%", "195.5%"],
      ["43.9%", "47.4%", "51%", "56.1%", "59.7%", "63.8%", "69.4%", "75%", "80.6%", "86.7%", "92.8%", "98.9%", "105.1%"],
      ["124%", "133.3%", "142.6%", "155%", "164.3%", "173.6%", "186%", "198.4%", "210.8%", "223.2%", "235.6%", "248%", "263.5%"],
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
      ["96% ×2", "103.2% ×2", "110.4% ×2", "120% ×2", "127.2% ×2", "134.4% ×2", "144% ×2", "153.6% ×2", "163.2% ×2", "172.8% ×2", "182.4% ×2", "192% ×2", "204% ×2"],
      ["100%", "107.5%", "115%", "125%", "132.5%", "140%", "150%", "160%", "170%", "180%", "190%", "200%", "212.5%"],
      ["400%", "430%", "460%", "500%", "530%", "560%", "600%", "640%", "680%", "720%", "760%", "800%", "850%"],
    ],
    bu: [
      [
        heal("160", "770"),
        heal("172", "847"),
        heal("184", "931"),
        heal("200", "1021"),
        heal("212", "1117"),
        heal("224", "1220"),
        heal("240", "1329"),
        heal("256", "1445"),
        heal("272", "1567"),
        heal("288", "1695"),
        heal("304", "1830"),
        heal("320", "1971"),
        heal("340", "2119"),
      ],
      [
        heal("32", "154"),
        heal("34.4", "169"),
        heal("36.8", "186"),
        heal("40", "204"),
        heal("42.4", "223"),
        heal("44.8", "244"),
        heal("48", "266"),
        heal("51.2", "289"),
        heal("54.4", "313"),
        heal("57.6", "339"),
        heal("60.8", "366"),
        heal("64", "394"),
        heal("68", "424"),
      ],
    ],
  };
}

async function main() {
  const existing = await prisma.character.findFirst({
    where: {
      OR: [
        { slug: "linneya" },
        { name: "Линнея" },
        { name: { contains: "Линне" } },
        { name: { contains: "линне" } },
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

  const SLUG = existing?.slug || "linneya";
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

  const artRassvet = a("Рассветная песнь звезды и луны");
  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");
  const artTrouppa = a("Золотая труппа");
  const artKokon = a("Кокон сладких грёз", "Кокон сладких грез");
  const artEmblem = a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы");

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.GEO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Золотая клятва льда"),
      1,
      "Золотая клятва льда",
      "Сигна",
      "Защита + баффы урона Лунного кристалла / Гео. Синергия с DEF-скейлом Линнеи.",
      "Лучший выбор: защита, криты и прямое усиление Лунного кристалла.",
      "S",
    ),
    rankedWeapon(
      w("Аква симулякрум"),
      2,
      "Аква симулякрум",
      "Универсальный урон",
      "Высокий К/У и бонус урона; HP-часть пассивки почти не используется.",
      "Сильная легендарка по критам и личному урону без сигны.",
      "A",
    ),
    rankedWeapon(
      w("Элегия погибели"),
      3,
      "Элегия погибели",
      "ВЭ · бафф отряду",
      "Высокая ВЭ; после навыка — МС и АТК союзникам.",
      "Удобна для ульты и баффа команды; личный урон слабее топа.",
      "A",
    ),
    rankedWeapon(
      w("Небесное крыло"),
      4,
      "Небесное крыло",
      "К/Ш · К/У",
      "Крит. шанс и крит. урон; баланс критов без сигны.",
      "Стабильные криты, если не хватает К/Ш с возвышения.",
      "A",
    ),
    rankedWeapon(
      w("Крюк силка"),
      5,
      "Крюк силка",
      "Лучший 4★",
      "Много ВЭ; под Высшим сиянием — заметный МС.",
      "Лучший эпик: энергия + МС в командах Нод-Края.",
      "A",
    ),
    rankedWeapon(
      w("Боевой лук Фавония"),
      6,
      "Боевой лук Фавония",
      "ВЭ · батарея",
      "Крит. попадания генерируют частицы энергии.",
      "Нужно ~50% К/Ш. Сильная батарея отряду и для ульты.",
      "B",
    ),
    rankedWeapon(
      w("Гаснущие сумерки"),
      7,
      "Гаснущие сумерки",
      "Личный урон",
      "Бонус урона по врагам; усиливает личные удары Луми.",
      "Ок для персонального DPS, если бафф отряду не приоритет.",
      "B",
    ),
    rankedWeapon(
      w("Рогатка"),
      8,
      "Рогатка",
      "Бюджет · К/Ш",
      "Крит. шанс на старте сборки.",
      "Временный вариант до эпика/легендарки.",
      "B",
    ),
    rankedWeapon(
      w("Посыльный"),
      9,
      "Посыльный",
      "Бюджет · К/У",
      "Крит. урон на ранней прокачке.",
      "Бюджетный К/У, пока нет лучшего лука.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artRassvet,
      1,
      "Рассветная песнь звезды и луны",
      "Лучший 4п",
      "2п +80 МС; 4п — урон Лунных реакций из кармана (+20%, при Высшем сиянии ещё +40%).",
      "Сигнатурный сет почти во всех отрядах Лунного кристалла.",
      "S",
    ),
    rankedArt(
      artSerenada,
      2,
      "Серенада шёлковой луны",
      "Когда Рассвет у союзника",
      "2п ВЭ; 4п — МС отряду и усиление Лунных реакций при знамении.",
      "Берите, если Рассвет отдаёте Коломбине или более сильному носителю.",
      "A",
    ),
    rankedArt(
      artTrouppa,
      3,
      "Золотая труппа",
      "Карманный урон",
      "2п урон навыка; 4п сильно усиливает Е из кармана.",
      "Около −10% к Рассвету; рабочая альтернатива без Нод-Край сетов.",
      "A",
    ),
    rankedArt(
      artKokon || artEmblem || artSerenada,
      4,
      "2п Кокон сладких грёз + 2п Эмблема / Серенада",
      "Временный 2+2",
      "2п защита (Кокон) + 2п ВЭ (Эмблема / Серенада).",
      "Пока нет 4п Рассвета/Серенады — закрывает DEF и энергию.",
      "B",
    ),
  ];
  if (artItems[3]) {
    artItems[3].name = "2п Кокон сладких грёз + 2п Эмблема / Серенада";
  }

  const matWorn = m("Потрёпанный мандат", "Потрепанный мандат");
  const matFine = m("Безупречный мандат");
  const matFrost = m("Заиндевевший мандат");
  const matBook1 = m("Учения о «Скитании»", "Учения о «Скитание»");
  const matBook2 = m("Указания о «Скитании»", "Указания о «Скитание»");
  const matBook3 = m("Философия о «Скитании»", "Философия о «Скитание»");
  const matTopaz1 = m("Осколок топаза Притхива", "Осколок топаза");
  const matTopaz2 = m("Фрагмент топаза Притхива", "Фрагмент топаза");
  const matTopaz3 = m("Кусок топаза Притхива", "Кусок топаза");
  const matTopaz4 = m("Драгоценный топаз Притхива", "Драгоценный топаз");
  const matPlume = m("Перо падшего созерцателя", "Перо падшего");
  const matMoth = m("Эфирокрылый мотылёк");
  const matElixir = m("Еретический эликсир");
  const matCrown = m("Корона прозрения");

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Линнея",
      body: `Линнея — **Гео-лук 5★**, натуралист и советник филиала **Гильдии искателей приключений** в **Нод-Крае**. Роль — **саб-дд / хилер / баффер** под **Лунный кристалл**: призывает **Луми**, конвертирует Гидро-кристалл → Лунный кристалл, лечит от защиты и режет Гео RES.

### Кратко
- **Рейтинг** — S+
- **Стихия / оружие** — Гео · лук
- **Возвышение** — крит. шанс (**+19.2%**, итого ~**24.2%** на 90 ур.)
- **База на 90 ур.** — HP **9895** · АТК **144** · Защита **907** · К/Ш **5% + 19.2%**
- **Добавлена** — патч **6.5**; сигна — **Золотая клятва льда**
- **День рождения** — 23 мая
- **Получение** — молитва события
- **Регион / фракция** — Нод-Край · Гильдия искателей приключений
- **Созвездие** — Птица Откровения
- **Особое блюдо** — **Радуга под тенью дерева**
- **Именная карточка** — **Грохочущий резонанс**
- **Лунное знамение** — +1, пока она в отряде`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Вводит и усиливает **Лунный кристалл** — редкий Гео-саб с конвертацией и баффом базового урона реакции.",
        "Карманный урон через **Луми** (Super / Ultimate / Standard Power Form) без постоянного присутствия на поле.",
        "Ульта лечит от **защиты** и обновляет длительность Луми — саб-дд и хилер в одном слоте.",
        "Срез Гео RES рядом с Луми; под **Высшим сиянием** — ещё сильнее.",
      ],
      cons: [
        "Нужен порог **~2000 защиты** для полной отдачи пассивок; иначе бафф ЛК и МС слабеют.",
        "Сильно раскрывается на **С2**; без конст бафф К/У и триггеры гармонии уже.",
        "Зависит от Гидро-аппа и команды под Лунный кристалл / Нод-Край.",
        "Кубок на **защиту**, не на Гео — сборка нестандартная для Гео-дд.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Линнею",
      body: `Сборка под **карманный урон Луми**, **хил** и **бафф Лунного кристалла**. Е, Q и пассивки скейлятся от **защиты**; цифры реакции — от **МС** (часть DEF конвертируется пассивкой).

Приоритет: **защита → криты → ВЭ → МС**. Пески — **защита%**; кубок — **защита%** (не Гео); корона — **К/Ш** или **К/У**. В сабах: **криты · защита% · ВЭ · МС**.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Порог **2000 защиты** нужен для полной отдачи пассивок; ВЭ — под комфортную ульту.",
      targets: [
        {
          id: uid(),
          label: "Защита",
          value: "2000+",
          hint: "Порог для полного А1 / баффа ЛК; можно выше ради урона и хила",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "130–150%",
          hint: "Ниже с Фавонией и батареями; выше в соло-энергетике",
        },
        {
          id: uid(),
          label: "МС",
          value: "~200–300",
          hint: "В бою с пассивкой и сетами; часть добирается от DEF",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "60–70% (или 75–85%)",
          hint: "С учётом возвышения и оружия; выше — если корона на К/У",
        },
        {
          id: uid(),
          label: "К/У",
          value: "1:2 к К/Ш",
          hint: "Ориентир баланса критов",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "Защита%", subs: "криты · защита% · ВЭ · МС" },
        { id: uid(), slot: "Кубок", main: "Защита%", subs: "криты · защита% · ВЭ · МС" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "криты · защита% · ВЭ · МС" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите **защиту**, **криты**, **ВЭ** и баффы под Лунный кристалл. Лучший 4★ — **Крюк силка** под Высшим сиянием.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Почти всегда цель — **Рассветная песнь звезды и луны**. Если Рассвет забирает Коломбина (или более сильный носитель) — **Серенада**. **Золотая труппа** — запасной вариант на урон Е.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в Лунном кристалле",
      intro: "Ориентир: Рассвет на Линнее, Серенада на саппорте — или наоборот, если у союзника выше отдача от Рассвета.",
      groups: [
        {
          id: uid(),
          title: "С Коломбиной",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Рассвет (или Серенада)",
              setImage: artImg(artRassvet, "Рассветная песнь звезды и луны"),
            },
            planRow(
              c("kolombina", "коломбина"),
              "Коломбина",
              "Серенада (или Рассвет)",
              artImg(artSerenada, "Серенада шёлковой луны"),
            ),
          ],
        },
        {
          id: uid(),
          title: "С Иллуги / Айно",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Рассвет",
              setImage: artImg(artRassvet, "Рассветная песнь звезды и луны"),
            },
            planRow(
              c("illugi", "иллуги") || c("ajno", "айно"),
              "Иллуги / Айно",
              "Серенада",
              artImg(artSerenada, "Серенада шёлковой луны"),
            ),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Лунный кристалл",
      body: `Ядро — **Гидро + Гео** с акцентом на **Лунный кристалл**. Лучшие команды — с **Цзы Баем** и **Коломбиной** / **Айно**. Гео-мейн (Навия, Итто, Ноэлль) и Гидро-дд (Нёвиллет, Аято) тоже работают.

Нужен хотя бы один герой **Нод-Края** для **Высшего сияния**, если хотите максимум пассивок сетов и знамения.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Линнеи:",
      rows: [
        roleRow(
          c("czy-baj", "цзы бай"),
          "Цзы Бай",
          "Копьё",
          "Сигнатурный мейн-дд Лунного кристалла. Вместе закрывают ядро Нод-Края и реакцию.",
        ),
        roleRow(
          c("kolombina", "коломбина"),
          "Коломбина",
          "Катализатор",
          "Сильный Гидро-саппорт Нод-Края: статус, баффы, конкуренция за Рассвет/Серенаду.",
        ),
        roleRow(
          c("ajno", "айно"),
          "Айно",
          "Двуручный меч",
          "Гидро + знамение Нод-Края. Удобный аппликатор без Коломбины.",
        ),
        roleRow(
          c("illugi", "иллуги"),
          "Иллуги",
          "Копьё",
          "Саб-дд / поддержка Лунного кристалла; хорошо стыкуется с Луми.",
        ),
        roleRow(
          c("gorou", "горо"),
          "Горо",
          "Лук",
          "Бафф защиты Гео-отряду — прямой буст урона и хила Линнеи.",
        ),
        roleRow(
          c("navia", "навия"),
          "Навия",
          "Двуручный меч",
          "Гео-мейн под кристаллами; Линнея даёт статус, хил и срез RES.",
        ),
        roleRow(
          c("furina", "фурина"),
          "Фурина",
          "Меч",
          "Гидро-статус и бафф урона; Линнея закрывает хил под Фанфары.",
        ),
        roleRow(
          c("yelan", "е лань", "e-lan"),
          "Е Лань",
          "Лук",
          "Карманный Гидро — бюджетная замена Коломбине/Фурине.",
        ),
        roleRow(
          c("xingqiu", "син цю", "sin-cyu"),
          "Син Цю",
          "Меч",
          "Бюджетный аппликатор из кармана + лёгкий подхил.",
        ),
        roleRow(
          c("kokomi", "кокоми"),
          "Кокоми",
          "Катализатор",
          "Стабильный Гидро и хил, если Фурины нет.",
        ),
        roleRow(
          c("neuvillette", "нёвиллет", "невиллет"),
          "Нёвиллет",
          "Катализатор",
          "Гидро-мейн; Лунный кристалл и Гео-сабы усиливают комфорт ротации.",
        ),
        roleRow(
          c("itto", "итто") || c("noelle", "ноэлль"),
          "Итто / Ноэлль",
          "Двуручный меч",
          "DEF/Гео-мейн; синергия с баффом защиты и срезом RES.",
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
          "Топ Лунный кристалл: Коломбина или Айно на статус, Иллуги или Горо на саб/бафф защиты.",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            member(c("kolombina", "коломбина") || c("ajno", "айно"), "Коломбина / Айно", "Гидро"),
            self("Саб-дд / хил"),
            member(c("illugi", "иллуги") || c("gorou", "горо"), "Иллуги / Горо", "Саб / бафф"),
          ],
          "Топ",
        ),
        variant(
          "Цзы Бай с Коломбиной и Фуриной: двойной Гидро-бафф, Линнея на хил и Лунный кристалл.",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            member(c("kolombina", "коломбина"), "Коломбина", "Гидро"),
            self("Саб-дд / хил"),
            member(c("furina", "фурина"), "Фурина", "Гидро / бафф"),
          ],
          "Топ",
        ),
        variant(
          "Без Коломбины: Иллуги или Горо + Кокоми на стабильный Гидро и комфорт.",
          [
            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
            member(c("illugi", "иллуги") || c("gorou", "горо"), "Иллуги / Горо", "Саб / бафф"),
            self("Саб-дд / хил"),
            member(c("kokomi", "кокоми"), "Кокоми", "Гидро / хил"),
          ],
          "Альтернатива",
        ),
        variant(
          "Гео-мейн Навия или Нин Гуан; четвёртый слот — Иллуги или Горо.",
          [
            member(c("navia", "навия") || c("ningguang", "нин гуан"), "Навия / Нин Гуан", "Мейн-дд"),
            member(c("kolombina", "коломбина") || c("furina", "фурина"), "Коломбина / Фурина", "Гидро"),
            self("Саб-дд / хил"),
            member(c("illugi", "иллуги") || c("gorou", "горо"), "Иллуги / Горо", "Саб / бафф"),
          ],
          "Альтернатива",
        ),
        variant(
          "Итто или Ноэлль под баффом защиты; флекс — Иллуги, Горо или Чжун Ли.",
          [
            member(c("itto", "итто") || c("noelle", "ноэлль"), "Итто / Ноэлль", "Мейн-дд"),
            member(c("kolombina", "коломбина") || c("furina", "фурина"), "Коломбина / Фурина", "Гидро"),
            self("Саб-дд / хил"),
            member(
              c("illugi", "иллуги") || c("gorou", "горо") || c("zhongli", "чжун ли"),
              "Иллуги / Горо / Чжун Ли",
              "Флекс",
            ),
          ],
          "Альтернатива",
        ),
        variant(
          "Бюджет: Гео-мейн + Е Лань или Син Цю; Иллуги или Айно закрывают Нод-Край.",
          [
            member(
              c("navia", "навия") || c("noelle", "ноэлль") || c("ningguang", "нин гуан"),
              "Навия / Ноэлль / Нин Гуан",
              "Мейн-дд",
            ),
            member(c("yelan", "е лань") || c("xingqiu", "син цю"), "Е Лань / Син Цю", "Гидро"),
            self("Саб-дд / хил"),
            member(c("illugi", "иллуги") || c("ajno", "айно"), "Иллуги / Айно", "Саб / Гидро"),
          ],
          "Бюджет",
        ),
        variant(
          "Гидро-дд: Нёвиллет или Аято; Альбедо или Тиори на Гео-резонанс и осколки.",
          [
            member(c("neuvillette", "нёвиллет", "невиллет") || c("ayato", "аято"), "Нёвиллет / Аято", "Мейн-дд"),
            member(c("albedo", "альбедо") || c("chiori", "тиори"), "Альбедо / Тиори", "Гео"),
            self("Саб-дд / хил"),
            member(
              c("illugi", "иллуги") || c("kolombina", "коломбина") || c("ajno", "айно"),
              "Иллуги / Коломбина / Айно",
              "Флекс",
            ),
          ],
          "Альтернатива",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Линнеи (материалы Нод-Края + топаз Притхива):",
      rows: [
        {
          id: uid(),
          name: matTopaz1?.name || "Топаз Притхива",
          image: matTopaz1?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия топаза Притхива)",
          href: matTopaz1 ? `/wiki/materials/${matTopaz1.slug}` : undefined,
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
          name: matPlume?.name || "Перо падшего созерцателя",
          image: matPlume?.image || "",
          qty: "46",
          where: "Мировой босс (Перо падшего созерцателя)",
          href: matPlume ? `/wiki/materials/${matPlume.slug}` : undefined,
        },
        {
          id: uid(),
          name: matMoth?.name || "Эфирокрылый мотылёк",
          image: matMoth?.image || "",
          qty: "168",
          where: "Диковинка (Эфирокрылый мотылёк)",
          href: matMoth ? `/wiki/materials/${matMoth.slug}` : undefined,
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
          rarity: 4 as const,
          note: "×3",
          qty: "3",
          href: matBook1 ? `/wiki/materials/${matBook1.slug}` : undefined,
        },
        {
          id: uid(),
          name: matBook2?.name || "Указания о «Скитании»",
          image: matBook2?.image || "",
          rarity: 4 as const,
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
          name: matElixir?.name || "Еретический эликсир",
          image: matElixir?.image || "",
          rarity: 5 as const,
          note: "×4",
          qty: "4",
          href: matElixir ? `/wiki/materials/${matElixir.slug}` : undefined,
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
        "Растёт **крит. шанс** (**+19.2%** на 90 ур., итого ~**24.2%** с базовыми 5%). Качайте хотя бы до **80/90**.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "Бонус К/Ш (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "770", "11", "71", "5%", "0%"),
        emptyStatsRow("20", "1 998", "29", "183", "5%", "0%"),
        emptyStatsRow("40", "3 978", "58", "365", "5%", "0%"),
        emptyStatsRow("50", "5 117", "74", "469", "5%", "4.8%"),
        emptyStatsRow("60", "6 419", "93", "588", "5%", "9.6%"),
        emptyStatsRow("70", "7 570", "110", "694", "5%", "9.6%"),
        emptyStatsRow("80", "8 730", "127", "800", "5%", "14.4%"),
        emptyStatsRow("90", "9 895", "144", "907", "5%", "19.2%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Линнея — карманный Гео-саб через **Луми** и хил от **защиты**. Е ставит Луми в **Super Power Form** (тап) или кормит до **Ultimate Power Form** (спам) с последующим **Standard**. Q лечит отряд и обновляет длительность Луми. Пассивка конвертирует **Гидро-кристалл → Лунный кристалл** и усиливает базовый урон реакции от DEF.

### Приоритет прокачки
**Е > Q > обычные** (обычные опциональны).

### Активные навыки
- **Протокол поимки** — до 3 выстрелов из лука; прицел копит кристалл; полное натяжение — **Гео**; удар в падении — урон по площади.
- **Контрмера: Боевой клич Луми! (Е)** — тап: Луми в Super Power Form бьёт Гео по площади (×2 от DEF); спам Е/НА кормит Луми → Ultimate Power Form (Million Ton Crush, считается Лунным кристаллом) → Standard. Длительность **25** сек., откат **18**.
- **Памятка: Руководство по выживанию в экстремальных условиях (Q)** — начальный и периодический хил от DEF; если Луми уже на поле — сброс длительности без смены формы. **60** энергии, откат **15**, длительность хила **12**.

### Пассивки
- **Полевые заметки** — Гео RES врагов рядом с Луми **−15%**; при **Высшем сиянии** ещё **−15%** после призыва.
- **Энциклопедия натуралиста** — МС = **5%** защиты Линнеи: знамению на поле — ему, иначе — себе.
- **Дар Лунного знамения: Исследование среды обитания** — Гидро-кристалл → Лунный кристалл; +**0.7%** базового урона ЛК за **100** DEF (макс. **14%**); **+1** к уровню Знамения.
- **Искатель приключений экстра-класса** — вне боя быстрее целится; стрелы ловят животных / помогают добывать руду.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Саппорты — статусы и баффы.
2. **Е** (тап для sustained Super Power) или **ЕЕЕЕ** (спам → Ultimate Power nuke → Standard).
3. Мейн-дд бьёт под Луми и Лунным кристаллом.
4. **Q** по необходимости — хил и обновление длительности Луми.

> Порядок: **баффы/статусы → Е (или ЕЕЕЕ) → дамагер → Q по нужде**.

### Стоит ли выбивать?
Сильный **S** саб-дд/хилер под **Лунный кристалл**. Раскрывается с Гидро-аппом и желательно с Цзы Баем / Коломбиной. Сборка на защиту понятная, но нужен порог DEF и баланс ВЭ/критов.

### С1 или сигна?
- **Сигна (Золотая клятва льда)** важнее **С1**: защита и баффы Лунного кристалла / Гео.
- **С2** сильнее сигны: **+40%** К/У Гидро/Гео и триггеры **Moondrift Harmony**.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `Линнея — натуралист и советник филиала **Гильдии искателей приключений** в **Нод-Крае**. Вместе с компаньоном **Луми** ведёт полевые заметки, классифицирует находки и помогает искателям выживать в экстремальных условиях.

Созвездие **Птица Откровения**, особое блюдо **Радуга под тенью дерева** и именная карточка **Грохочущий резонанс** подчёркивают её образ исследователя и «грохочущего» напарника Луми.`,
    },
  ];

  if (!matBook1) noteMissing("material", "Учения о «Скитании»");
  if (!matBook2) noteMissing("material", "Указания о «Скитании»");
  if (!matBook3) noteMissing("material", "Философия о «Скитании»");
  if (!matElixir) noteMissing("material", "Еретический эликсир");

  const levelMaterials: CharacterMaterial[] = [
    matCard(matMoth, "Эфирокрылый мотылёк", 168, "local", 1),
    matCard(matPlume, "Перо падшего созерцателя", 46, "boss", 4),
    matCard(matTopaz1, "Осколок топаза Притхива", 1, "ascension", 2),
    matCard(matTopaz2, "Фрагмент топаза Притхива", 9, "ascension", 3),
    matCard(matTopaz3, "Кусок топаза Притхива", 9, "ascension", 4),
    matCard(matTopaz4, "Драгоценный топаз Притхива", 6, "ascension", 5),
    matCard(matWorn, "Потрёпанный мандат", 18, "ascension", 1),
    matCard(matFine, "Безупречный мандат", 30, "ascension", 2),
    matCard(matFrost, "Заиндевевший мандат", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Скитании»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Скитании»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Скитании»", 114, "talent", 4),
    matCard(matElixir, "Еретический эликсир", 12, "talent", 5),
    matCard(matCrown, "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Линнея — Гео саб-дд и хилер Лунного кристалла: билд, оружие, сеты и отряды.";

  const iconBase = "/images/talents/linneya";
  const cIconBase = "/images/constellations/linneya";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));
  const tv = loadTalentValues();

  const talents = [
    {
      id: "t_na",
      name: "Протокол поимки",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до трёх последовательных выстрелов из лука.\n\n**Заряженная:** более точный прицельный выстрел. При прицеливании на наконечнике копятся каменные кристаллы; полностью заряженная кристаллическая стрела наносит **Гео урон**.\n\n**Удар в падении:** град стрел в воздухе, затем урон по площади при приземлении.",
      loreText: "Протокол поимки активирован. Цель зафиксирована.",
      levelLabels: lv13,
      stats: [
        { label: "Урон 1 удара", values: tv.na[0] },
        { label: "Урон 2 удара", values: tv.na[1] },
        { label: "Урон 3 удара", values: tv.na[2] },
        { label: "Прицельный выстрел", values: tv.na[3] },
        { label: "Полностью заряженный прицел", values: tv.na[4] },
        { label: "Урон в падении", values: tv.na[5] },
        { label: "Низкий / высокий удар", values: tv.na[6] },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Контрмера: Боевой клич Луми!",
      icon: `${iconBase}/skill.png`,
      description:
        "Приключение с **Луми**! В зависимости от нажатий Луми бьёт в разных формах.\n\n**Тап:** Луми в **Super Power Form** непрерывно атакует рядом стоящих врагов, нанося **Гео урон** по площади (×2 от защиты). Если рядом есть лунные осколки (Moondrifts), Луми также наносит **Гео** по площади, считающийся уроном **Лунного кристалла**.\n\n**Спам:** после Е повторные нажатия Е/НА кормят Луми кристаллами → **Ultimate Power Form** (мощный **Million Ton Crush**, урон Лунного кристалла) → переход в **Standard Power Form**.\n\nДлительность **25 сек.** Откат **18 сек.**",
      loreText: "Луми, вперёд!",
      levelLabels: lv13,
      stats: [
        { label: "Урон молота Луми (защита ×2)", values: tv.sk[0] },
        { label: "Урон усиленного молота", values: tv.sk[1] },
        { label: "Урон мегатонного молота", values: tv.sk[2] },
        { label: "Длительность Луми", values: Array(13).fill("25 сек.") },
        { label: "Время отката", values: Array(13).fill("18 сек.") },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Памятка: Руководство по выживанию в экстремальных условиях",
      icon: `${iconBase}/burst.png`,
      description:
        "Даже мастерам приключений нужен отдых! Линнея призывает Луми в **Super Power Form** и лечит союзников рядом. Короткое время непрерывно лечит активного персонажа рядом от **защиты** Линнеи.\n\nЕсли Луми уже на поле — длительность сбрасывается, форма удара не меняется.\n\nЭнергия **60**, откат **15 сек.**, длительность хила **12 сек.**",
      loreText: "Настоящий искатель приключений ценит выход из беды выше любой находки.",
      levelLabels: lv13,
      stats: [
        { label: "Начальное лечение", values: tv.bu[0] },
        { label: "Периодическое лечение", values: tv.bu[1] },
        { label: "Длительность лечения", values: Array(13).fill("12 сек.") },
        { label: "Время отката", values: Array(13).fill("15 сек.") },
        { label: "Потребление энергии", values: Array(13).fill("60") },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Полевые заметки",
      icon: `${iconBase}/passive1.png`,
      description:
        "Пока **Луми** на поле, **Гео RES** врагов рядом с ней **−15%**.\n\n**Лунное знамение: Высшее сияние:** Е и Q усилены. После призыва Луми Гео RES врагов рядом дополнительно **−15%**.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Энциклопедия натуралиста",
      icon: `${iconBase}/passive2.png`,
      description:
        "Линнея повышает **МС** персонажей отряда в зависимости от активного героя: бонус = **5%** её защиты.\n\n· Активный — персонаж **Лунного знамения** → МС ему.\n· Иначе → МС самой Линнее.",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Дар Лунного знамения: Исследование среды обитания",
      icon: `${iconBase}/passive3.png`,
      description:
        "Реакция **Гидро-кристалл** союзников конвертируется в **Лунный кристалл**. Базовый урон ЛК +**0.7%** за каждые **100** защиты Линнеи (макс. **+14%**).\n\nПока она в отряде, уровень **Лунного знамения** +**1**.",
      order: 5,
    },
    {
      id: "t_util",
      name: "Искатель приключений экстра-класса",
      icon: `${iconBase}/utility.png`,
      description:
        "Вне боя время зарядки прицела сильно снижено; вместо обычной заряженной стрелы — **сверхудобная быстрая стрела**. По животным — сеть для «поимки»; по рудным жилам — Луми помогает добыть руду.",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Условная классификация",
      icon: `${cIconBase}/c1.png`,
      description:
        "При Е или **Moondrift Harmony** Линнея получает **6** стаков **Field Catalog** на **10** сек. (макс. **18**). Когда союзники наносят урон Лунного кристалла — расходуется 1 стак: урон +**75%** защиты Линнеи.\n\nПри **Million Ton Crush** в Ultimate Power Form можно сжечь до **5** стаков: каждый даёт +**150%** защиты к урону.",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "Вести радостные и печальные",
      icon: `${cIconBase}/c2.png`,
      description:
        "В течение **8** сек. после **Moondrift Harmony** все **Гидро** и **Гео** союзники получают **+40%** К/У. **Million Ton Crush** в Ultimate Power Form дополнительно получает **+150%** К/У.\n\n**Высшее сияние:** Heavy Overdrive Hammer (Super) и Million Ton Crush (Ultimate) сами вызывают Moondrift Harmony (Гидро и Гео считаются внёсшими статусы).",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Содержательная страница журнала",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень навыка **Контрмера: Боевой клич Луми!** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Интуиция эксперта",
      icon: `${cIconBase}/c4.png`,
      description:
        "В течение **5** сек. после Moondrift Harmony защита Линнеи и активного персонажа +**25%**. На поле эффект может стакаться.",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "Прощальный подарок страны фей",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень навыка **Памятка: Руководство по выживанию в экстремальных условиях** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Сон Золотого пса",
      icon: `${cIconBase}/c6.png`,
      description:
        "Усиливает **Условную классификацию**: при Е или Moondrift Harmony сразу макс. стаки Field Catalog; при расходе сжигается вдвое больше стаков, бонус урона ×**1.5** к исходному.\n\n**Высшее сияние:** урон Лунного кристалла союзников рядом **возвышается** на **25%**.",
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
        element: Element.GEO,
        weaponType: "Лук",
        region: "Нод-Край",
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
        element: Element.GEO,
        weaponType: "Лук",
        region: "Нод-Край",
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
