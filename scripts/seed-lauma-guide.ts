/**
 * Импорт гайда на Лауму.
 *
 *   npx tsx scripts/seed-lauma-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Лаумы уже корректные иконки в БД.
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

const SLUG = "lauma";
const NAME = "Лаума";
/** Только для отображения в блоках гайда (self / setPlan) — не пишем в upsert. */
const IMAGE = "/uploads/icons/1785445941330-0f929f2e.png";
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
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.DENDRO;
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
    elementIcon: ELEMENT_SVG.DENDRO,
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
    elementIcon: ELEMENT_SVG.DENDRO,
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

/** L1–13: «АТК + МС» для Святыни. */
function ae(atk: string, em: string): string {
  return `${atk}% АТК + ${em}% МС`;
}

function emPct(v: string): string {
  return `${v}% МС`;
}

function emPerDew(v: string): string {
  return `${v}% МС за Зелёную росу`;
}

async function main() {
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

  const artLes = a("Воспоминания дремучего леса");
  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");
  const artNoch = a("Ночь открытия неба");
  const artPozol = a("Позолоченные сны");
  const artCvetok = a("Цветок потерянного рая");
  const artEmblem = a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы");
  const artAnsambl = a("Странствующий ансамбль");

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.DENDRO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Зеркало прядильщицы ночи"),
      1,
      "Зеркало прядильщицы ночи",
      "Сигна",
      "МС носителю; при Растущей и Убывающей луне вместе — сильный бафф Бутонизации / Вегетации / Цветения / Лунной бутонизации отряду.",
      "Лучший выбор: максимум усилений под Бутонизацию и ЛБ.",
      "S",
    ),
    rankedWeapon(
      w("Сновидения тысячи ночей"),
      2,
      "Сновидения тысячи ночей",
      "МС отряду",
      "МС / бонус стихии по составу; +МС союзникам рядом.",
      "Сильная универсальная альтернатива сигнатуре.",
      "A",
    ),
    rankedWeapon(
      w("Лютня ткача света"),
      3,
      "Лютня ткача света",
      "ВЭ + МС",
      "После Е — +100 МС на 20 сек.; сабстат на ВЭ.",
      "Удобно: можно собирать ~700 МС в артефактах и добивать пассивкой.",
      "A",
    ),
    rankedWeapon(
      w("Фонарь чёрной сердцевины", "Фонарь черной сердцевины"),
      4,
      "Фонарь чёрной сердцевины",
      "Крафт Нод-Края",
      "Бонус Бутонизации / ЛБ; усиливается при Высшем сиянии.",
      "Эпик под Гидро+Дендро с союзником Нод-Края (Айно и т.п.).",
      "A",
    ),
    rankedWeapon(
      w("Бдение взывающего к звёздам", "Бдение взывающего к звездам"),
      5,
      "Бдение взывающего к звёздам",
      "МС",
      "Огромный МС; пассивка щита почти не реализуется.",
      "Затычка по статам, если уже есть книга.",
      "B",
    ),
    rankedWeapon(
      w("Церемониальные мемуары"),
      6,
      "Церемониальные мемуары",
      "МС · сброс Е",
      "МС и шанс сбросить откат элементального навыка.",
      "Ок для обновления Е; при срабатывании не жмите Е сразу — оставьте на ротацию с Q.",
      "B",
    ),
    rankedWeapon(
      w("Плод восполнения"),
      7,
      "Плод восполнения",
      "F2P",
      "Стаки МС после реакций (даже из кармана); минус АТК неважен.",
      "Бесплатный вариант под постоянные реакции.",
      "B",
    ),
    rankedWeapon(
      w("Морской атлас"),
      8,
      "Морской атлас",
      "Временный F2P",
      "МС и временный бонус элементального урона после реакций.",
      "На первое время; мало МС на сабстате.",
      "C",
    ),
    rankedWeapon(
      w("Кодекс Фавония"),
      9,
      "Кодекс Фавония",
      "ВЭ · частицы",
      "Крит. попадания генерируют частицы энергии.",
      "Нужно ~50% К/Ш. Полезно, если ульту не успеваете.",
      "C",
    ),
  ];

  const artEmPiece =
    artNoch || artPozol || artCvetok || artEmblem || artAnsambl || artSerenada;
  if (!artEmPiece) noteMissing("artifact", "2+2 МС / ВЭ сеты");

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artLes,
      1,
      "Воспоминания дремучего леса",
      "Лучший 4п",
      "−30% Дендро RES после Е/Q (срабатывает из кармана) + 15% Дендро.",
      "Топ в большинстве отрядов с Дендро-дд; суммируется со срезом резистов Лаумы.",
      "S",
    ),
    rankedArt(
      artSerenada,
      2,
      "Серенада шёлковой луны",
      "Нод-Край / Лунные",
      "ВЭ + МС отряду и усиление Лунных реакций при знамении.",
      "Сильный сет под Нод-Край и Лунную бутонизацию; нужен союзник региона.",
      "S",
    ),
    {
      id: uid(),
      rank: 3,
      name: "2+2 МС / ВЭ (Ночь / Позолоченные / Цветок + Эмблема / Серенада)",
      image: artEmPiece?.image || STUB_IMAGE,
      rarity: 5 as const,
      href: artEmPiece ? `/wiki/artifacts/${artEmPiece.slug}` : undefined,
      subtitle: "2+2",
      effect: "2п МС (+80) и/или 2п ВЭ (+20%) — комбинируйте Ночь, Позолоченные, Цветок, Эмблему, Серенаду.",
      verdict: "Если не хватает МС или ВЭ до порогов — соберите лучшие куски 2+2.",
      tier: "A",
    },
  ];

  const matWorn = m("Потрёпанный мандат", "Потрепанный мандат");
  const matFine = m("Безупречный мандат");
  const matFrost = m("Заиндевевший мандат");
  if (!matWorn) noteMissing("material", "Потрепанный мандат");
  if (!matFine) noteMissing("material", "Безупречный мандат");

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Лаума",
      body: `Лаума — **Дендро-катализатор 5★**, жрица **Морозной луны** из фракции **Дети Морозной Луны** (Нод-Край). Роль — **саппорт-баффер** под **Бутонизацию** и **Лунную бутонизацию**: аппликатор, усилитель ядер и реакций; на **С1** ещё и хилер.

### Кратко
- **Рейтинг** — S+
- **Титул** — *Evermoon’s Sacrament Song* · жрица Морозной луны · Дети Морозной Луны
- **Стихия / оружие** — Дендро · катализатор
- **Возвышение** — мастерство стихий (**115.2** МС к 90 ур.)
- **База на 90 ур.** — HP **10 654** · АТК **255** · Защита **669** · бонус МС **115.2**
- **Баннер** — «Лунная песнь чащи»; сигна — **Зеркало прядильщицы ночи**
- **День рождения** — 1 марта
- **Получение** — молитва события
- **Регион / фракция** — Нод-Край · Дети Морозной Луны
- **Созвездие** — Серебряный Олень (EN *Cerva Nivea*)
- **Особое блюдо** — **Шепот в лесу**
- **Озвучка** — EN Alexandra Guelff · JP Kuwashima Houko · CN Angela Chong · KR Chang Chae-yeon`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "«Обновляет» Бутонизацию: ядра бьют сильнее, появляется Лунная бутонизация и криты реакций через пассивки — сильный прирост для бутонных дамагеров.",
        "Удобное передвижение: заряженная переводит в форму Посланницы духов с длинными рывками.",
        "Простая сборка: нужны в основном **МС** и **ВЭ**.",
        "Баффер + аппликатор в одном слоте; с **С1** закрывает ещё и хил.",
      ],
      cons: [
        "Узкий профиль против Нахиды: жрица заточена под Бутонизацию / ЛБ, а не под все Дендро-реакции одинаково.",
        "Слабые консты до **С6**: заметный апгрейд скилл-сета и роли саб-дд — на полном созвездии.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Лауму",
      body: `Сборка целиком под **бафф и аппликацию**. Скейлы Е/Q и усиления ядер — от **мастерства стихий**. Криты почти не нужны (кроме **Кодекса Фавония**).

Приоритет: **МС → ВЭ**. Пески, кубок и корона — на **МС**. В сабах добивайте **МС** и **ВЭ%**.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Главное — порог МС для полного баффа и комфортная ульта.",
      targets: [
        {
          id: uid(),
          label: "МС",
          value: "800+",
          hint: "Порог для полного бонуса пассивок и усилений от МС",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "180–200 / ~160",
          hint: "Без дендро-резонанса 180–200; со вторым Дендро достаточно ~160",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "~50% (опц.)",
          hint: "Только для Кодекса Фавония; К/У неважен",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "МС", subs: "МС · ВЭ%" },
        { id: uid(), slot: "Кубок", main: "МС", subs: "МС · ВЭ%" },
        { id: uid(), slot: "Корона", main: "МС", subs: "МС · ВЭ%" },
        {
          id: uid(),
          slot: "Цветок / Перо",
          main: "HP / АТК",
          subs: "МС · ВЭ%",
        },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите **МС** и баффы отряду под Бутонизацию / ЛБ. Книги с ВЭ помогают держать ульту.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "В отрядах с Дендро-дд чаще берите **Воспоминания дремучего леса**. Под Нод-Край / Лунные реакции — **Серенада**. Иначе 2+2 на МС/ВЭ.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в бутонных отрядах",
      intro: "Ориентир для Лунной бутонизации и классической Бутонизации (Нилу).",
      groups: [
        {
          id: uid(),
          title: "С Нефер (Лунная бутонизация)",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Воспоминания дремучего леса / Серенада",
              setImage: artImg(artLes, "Воспоминания дремучего леса"),
            },
            planRow(c("nefer", "нефер"), "Нефер", "Ночь открытия неба", artImg(artNoch, "Ночь открытия неба")),
            planRow(
              c("kolombina", "коломбина"),
              "Коломбина",
              "Серенада / Рассвет",
              artImg(artSerenada, "Серенада шёлковой луны"),
            ),
            planRow(
              c("nahida", "нахида"),
              "Нахида",
              "Воспоминания / Позолоченные",
              artImg(artLes, "Воспоминания дремучего леса"),
            ),
          ],
        },
        {
          id: uid(),
          title: "С Нилу (Бутонизация)",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Воспоминания дремучего леса",
              setImage: artImg(artLes, "Воспоминания дремучего леса"),
            },
            planRow(c("nilou", "нилу"), "Нилу", "2+2 HP / Цветок", artImg(artCvetok, "Цветок потерянного рая")),
            planRow(
              c("nahida", "нахида"),
              "Нахида",
              "Позолоченные / Воспоминания",
              artImg(artPozol, "Позолоченные сны"),
            ),
            planRow(
              c("kolombina", "коломбина") || c("kokomi", "кокоми"),
              "Коломбина / Кокоми",
              "Серенада / Океанская",
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
      title: "Отряды под Бутонизацию и Лунную бутонизацию",
      body: `Ядро — **Гидро-аппликатор + Дендро** (сама Лаума часто закрывает Дендро-статус). Лучшие команды — с **Нефер** (Лунная бутонизация) и **Нилу** (Бутонизация). Вегетация с **Аль-Хайтамом** и Куки тоже сильна.

Нужен хотя бы один герой **Нод-Края** для полного **Высшего сияния**, если хотите максимум пассивок жрицы.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Лаумы:",
      rows: [
        roleRow(
          c("nefer", "нефер"),
          "Нефер",
          "Катализатор",
          "Сигнатурный мейн-дд Лунной бутонизации. Вместе образуют сильное ядро Нод-Края.",
        ),
        roleRow(
          c("kolombina", "коломбина"),
          "Коломбина",
          "Катализатор",
          "Лучший Гидро-саппорт: стабильный статус с Е, Роса, баффы. Упрощает hold-Е Лаумы с Нефер.",
        ),
        roleRow(
          c("yagoda", "ягода"),
          "Ягода",
          "Лук",
          "Слот Нод-Края + хил/бафф. Уместна с Нефер, если Гидро уже закрыт (Фурина и т.п.); сильнее на С6.",
        ),
        roleRow(
          c("nilou", "нилу"),
          "Нилу",
          "Меч",
          "Классическая Бутонизация: свои баффы ядер и Семена изобилия. Отличная синергия с жрицей.",
        ),
        roleRow(
          c("kavekh", "кавех", "kaveh"),
          "Кавех",
          "Двуручный меч",
          "Дендро-дд под бутоны; нужен апп. С С1 Лаумы можно убрать отдельного хилера.",
        ),
        roleRow(
          c("nahida", "нахида"),
          "Нахида",
          "Катализатор",
          "Резонанс, карманный дамаг и МС. На С2 возможен «конфликт» критов ядер с пассивкой Лаумы.",
        ),
        roleRow(
          c("xingqiu", "син цю", "sin-cyu"),
          "Син Цю",
          "Меч",
          "Сильный эпик-аппликатор из кармана; нужен драйвер с обычными атаками.",
        ),
        roleRow(
          c("yelan", "е лань", "e-lan"),
          "Е Лань",
          "Лук",
          "Гидро-статус + бафф урона — выгодно при выраженном мейн-дд.",
        ),
        roleRow(
          c("kokomi", "кокоми", "sangonomiya-kokomi"),
          "Кокоми",
          "Катализатор",
          "АоЕ-апп и хил; драйвер через ульту. Альтернатива Коломбине в Нилу-командах.",
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
          "Топ с Нефер: Коломбина даёт статус и Росу. Без С1 Лаумы на Коломбину — Прототип: Янтарь для подхила.",
          [
            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
            self("Саппорт"),
            member(c("kolombina", "коломбина"), "Коломбина", "Гидро"),
            member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
          ],
          "Топ",
        ),
        variant(
          "Комфорт: Бай Чжу или Яо Яо вместо Нахиды — меньше урона, больше выживаемости.",
          [
            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
            self("Саппорт"),
            member(c("kolombina", "коломбина"), "Коломбина", "Гидро"),
            member(c("bay-chzhu", "бай чжу"), "Бай Чжу / Яо Яо", "Хил"),
          ],
          "Топ",
        ),
        variant(
          "Без Коломбины: Айно (лучше С6) или Фурина + Нахида. С Фуриной желателен хилер.",
          [
            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
            self("Саппорт"),
            member(c("ajno", "айно"), "Айно / Фурина", "Гидро"),
            member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
          ],
          "Альтернатива",
        ),
        variant(
          "Нилу-Бутонизация: Нахида или Коллеи; четвёртый слот — Коломбина (с С1 Лаумы) или Кокоми на хил.",
          [
            member(c("nilou", "нилу"), "Нилу", "Мейн-дд"),
            self("Саппорт"),
            member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
            member(c("kolombina", "коломбина"), "Коломбина / Кокоми", "Гидро/хил"),
          ],
          "Топ",
        ),
        variant(
          "Вегетация с Аль-Хайтамом: Е Лань или Син Цю + Куки на хил и взрыв бутонов.",
          [
            member(c("al-khaytam", "аль-хайтам", "alhaitham"), "Аль-Хайтам", "Мейн-дд"),
            self("Саппорт"),
            member(c("yelan", "е лань"), "Е Лань / Син Цю", "Гидро"),
            member(c("kuki", "синобу", "kuki-sinobu"), "Синобу", "Хил / Электро"),
          ],
          "Альтернатива",
        ),
        variant(
          "Бюджет: Коллеи на Дендро, Айно на Гидро и Знамение, Барбара или Яо Яо на выживаемость.",
          [
            self("Саппорт"),
            member(c("collei", "коллеи"), "Коллеи", "Дендро"),
            member(c("ajno", "айно"), "Айно", "Гидро"),
            member(c("barbara", "барбара"), "Барбара / Яо Яо", "Хил"),
          ],
          "Бюджет",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Ресурсы для возвышения Лаумы:",
      rows: [
        {
          id: uid(),
          name: m("Осколок изумруда Нагадус")?.name || "Изумруд Нагадус",
          image: m("Осколок изумруда Нагадус")?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия изумруда Нагадус)",
          href: m("Осколок изумруда Нагадус")
            ? `/wiki/materials/${m("Осколок изумруда Нагадус")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: (() => {
            if (!matWorn) noteMissing("material", "Потрепанный мандат");
            if (!matFine) noteMissing("material", "Безупречный мандат");
            return matFrost?.name || "Мандаты опричников";
          })(),
          image: matFrost?.image || "",
          qty: "18 / 30 / 36",
          where: "Опричники Фатуи (Потрёпанный / Безупречный / Заиндевевший мандат)",
          href: matFrost ? `/wiki/materials/${matFrost.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Светящееся чешуйчатое перо")?.name || "Светящееся чешуйчатое перо",
          image: m("Светящееся чешуйчатое перо")?.image || "",
          qty: "46",
          where: "Мировой босс «Лучезарный мотылёк-призрак»",
          href: m("Светящееся чешуйчатое перо")
            ? `/wiki/materials/${m("Светящееся чешуйчатое перо")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Серебро захода луны")?.name || "Серебро захода луны",
          image: m("Серебро захода луны")?.image || "",
          qty: "168",
          where: "Диковинка Нод-Края",
          href: m("Серебро захода луны")
            ? `/wiki/materials/${m("Серебро захода луны")!.slug}`
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
          name: m("Учения о «Лунном свете»")?.name || "Учения о «Лунном свете»",
          image: m("Учения о «Лунном свете»")?.image || "",
          rarity: 4 as const,
          note: "×3",
          qty: "3",
          href: m("Учения о «Лунном свете»")
            ? `/wiki/materials/${m("Учения о «Лунном свете»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Указания о «Лунном свете»")?.name || "Указания о «Лунном свете»",
          image: m("Указания о «Лунном свете»")?.image || "",
          rarity: 4 as const,
          note: "×21",
          qty: "21",
          href: m("Указания о «Лунном свете»")
            ? `/wiki/materials/${m("Указания о «Лунном свете»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Философия о «Лунном свете»")?.name || "Философия о «Лунном свете»",
          image: m("Философия о «Лунном свете»")?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: m("Философия о «Лунном свете»")
            ? `/wiki/materials/${m("Философия о «Лунном свете»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Истлевшее чешуйчатое перо")?.name || "Истлевшее чешуйчатое перо",
          image: m("Истлевшее чешуйчатое перо")?.image || "",
          rarity: 5 as const,
          note: "×4",
          qty: "4",
          href: m("Истлевшее чешуйчатое перо")
            ? `/wiki/materials/${m("Истлевшее чешуйчатое перо")!.slug}`
            : undefined,
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
        "Растёт **мастерство стихий** (**115.2** на 90 ур.). Качайте хотя бы до **80/90**; полный 90 не обязателен, если реакции закрывают союзники.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/Ш",
        "Бонус МС (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "829", "20", "52", "5%", "0"),
        emptyStatsRow("20", "2 151", "51", "135", "5%", "0"),
        emptyStatsRow("40", "4 283", "103", "269", "5%", "0"),
        emptyStatsRow("50", "5 509", "132", "346", "5%", "28.8"),
        emptyStatsRow("60", "6 911", "165", "434", "5%", "57.6"),
        emptyStatsRow("70", "8 151", "195", "512", "5%", "57.6"),
        emptyStatsRow("80", "9 400", "225", "590", "5%", "86.4"),
        emptyStatsRow("90", "10 654", "255", "669", "5%", "115.2"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Лаума — баффер Дендро-реакций через цепочку **Зелёная роса → Песня луны → Сизый гимн**. Ядра от Бутонизации / ЛБ копят Росу; hold-Е тратит её на **Песню луны** и ставит **Святыню инеевой чащи**; **Q** конвертирует Песню в стаки **Сизого гимна**, усиливающие взрывы бутонов. Подробные таблицы — во вкладке **Билд → Таланты**.

### Приоритет прокачки
**Е ≥ Q > обычные** (обычные почти не нужны до С6).

### Активные навыки
- **Скитания Линнунраты** — 3 удара Дендро; заряженная → форма **Посланницы духов** (рывки, 10 сек.); выход → **Воззвание к духам** по площади.
- **Рунная песнь: Безрассветный покой карсикко (Е)** — press: Дендро вокруг; hold (нужна ≥1 Роса): АоЕ + импульс ЛБ за каждую Росу (**Песня луны**), аура **Святыни** (урон АТК+МС, срез Гидро/Дендро RES). Откат **12** сек.
- **Рунная песнь: Сердца становятся луной (Q)** — **18** стаков Сизого гимна; Песня луны → **+6** гимна за стак. Усиливает Бутонизацию / Вегетацию / Цветение / ЛБ от МС. **60** энергии, откат **15**.

### Пассивки
- **Свет для морозной ночи** — после Е на 20 сек.: при Зарождающемся сиянии ядра критуют (фикс. К/Ш/К/У); при Высшем — криты **Лунной бутонизации**.
- **Омовение для родника** — бонус урона Е и сокращение отката формы Посланницы от МС.
- **Дар лунного знамения: Хор природы** — Бутонизация → Лунная; +базовый урон ЛБ от МС (макс. **14%**); +1 к уровню Знамения.
- **Молитвы лесу** — диковинки Нод-Края на карте; особое взаимодействие с животными под куувяки.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Союзники: Гидро + Дендро — накопить **Зелёную росу** (ядра ЛБ).
2. Лаума: **hold Е** — Роса → Песня луны + Святыня.
3. Сразу **Q** — Песня → **Сизый гимн** (до **36** стаков при 3 Песнях).
4. Мейн-дд / драйвер — тратит гимн на взрывы бутонов.

> Порядок: **статусы → hold Е → Q → дамагер**.

### Стоит ли выбивать?
Сильный **S+** саппорт, но узкий: раскрывается в Бутонизации / ЛБ / Вегетации. Нужен стабильный Гидро-апп и желательно готовая команда (Нефер, Нилу, Аль-Хайтам и т.п.). Сборка лёгкая — только МС и ВЭ.

### С1 или сигна?
- **С1** — если хотите убрать хилера и поставить второго аппа/баффера (удобно с Нилу).
- **Сигна** — если хилер уже есть (Куки в Вегетации и т.п.): прямой прирост урона реакций и МС.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `Лаума — жрица **Морозной луны**, рождённая среди **Детей Морозной Луны** в Нод-Крае. Титул *Evermoon’s Sacrament Song* отражает её роль хранительницы лунных обрядов рощи.

Она связана с оленями и лесными духами; созвездие **Серебряный Олень** (*Cerva Nivea*) и особое блюдо **«Шепот в лесу»** подчёркивают эту связь с природой и луной.`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Серебро захода луны"), "Серебро захода луны", 168, "local", 1),
    matCard(m("Светящееся чешуйчатое перо"), "Светящееся чешуйчатое перо", 46, "boss", 4),
    matCard(m("Осколок изумруда Нагадус"), "Осколок изумруда Нагадус", 1, "ascension", 2),
    matCard(m("Фрагмент изумруда Нагадус"), "Фрагмент изумруда Нагадус", 9, "ascension", 3),
    matCard(m("Кусок изумруда Нагадус"), "Кусок изумруда Нагадус", 9, "ascension", 4),
    matCard(m("Драгоценный изумруд Нагадус"), "Драгоценный изумруд Нагадус", 6, "ascension", 5),
    matCard(matWorn, "Потрёпанный мандат", 18, "ascension", 1),
    matCard(matFine, "Безупречный мандат", 30, "ascension", 2),
    matCard(matFrost, "Заиндевевший мандат", 36, "ascension", 3),
    matCard(m("Учения о «Лунном свете»"), "Учения о «Лунном свете»", 9, "talent", 2),
    matCard(m("Указания о «Лунном свете»"), "Указания о «Лунном свете»", 63, "talent", 3),
    matCard(m("Философия о «Лунном свете»"), "Философия о «Лунном свете»", 114, "talent", 4),
    matCard(m("Истлевшее чешуйчатое перо"), "Истлевшее чешуйчатое перо", 12, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Лаума — Дендро саппорт-баффер Бутонизации и Лунной бутонизации: билд, оружие, сеты, отряды и таланты.";

  const iconBase = "/images/talents/lauma";
  const cIconBase = "/images/constellations/lauma";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const talents = [
    {
      id: "t_na",
      name: "Скитания Линнунраты",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до трёх ударов — **Дендро урон**.\n\n**Заряженная:** форма **Посланницы духов** до **10 сек.** — рывки вперёд с расходом выносливости и повышенным сопротивлением прерыванию. При выходе из формы заряженная заменяется на **Воззвание к духам** — короткое заклинание с **Дендро уроном** по площади.\n\n**Удар в падении:** стремительное падение, затем **Дендро урон** по площади.",
      loreText: "Странствия по роще Линнунраты — шаг за шагом под светом Морозной луны.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон 1 удара",
          values: [
            "33.7%",
            "36.23%",
            "38.76%",
            "42.13%",
            "44.66%",
            "47.18%",
            "50.55%",
            "53.92%",
            "57.29%",
            "60.66%",
            "64.03%",
            "67.4%",
            "71.62%",
          ],
        },
        {
          label: "Урон 2 удара",
          values: [
            "31.8%",
            "34.19%",
            "36.58%",
            "39.76%",
            "42.14%",
            "44.53%",
            "47.71%",
            "50.89%",
            "54.07%",
            "57.25%",
            "60.43%",
            "63.61%",
            "67.59%",
          ],
        },
        {
          label: "Урон 3 удара",
          values: [
            "44.5%",
            "47.83%",
            "51.17%",
            "55.62%",
            "58.96%",
            "62.3%",
            "66.75%",
            "71.19%",
            "75.64%",
            "80.09%",
            "84.54%",
            "88.99%",
            "94.56%",
          ],
        },
        {
          label: "Расход выносливости (движение)",
          values: Array(13).fill("25/сек."),
        },
        {
          label: "Расход выносливости (прыжок)",
          values: Array(13).fill("10"),
        },
        {
          label: "Длительность формы",
          values: Array(13).fill("10 сек."),
        },
        {
          label: "Откат превращения",
          values: Array(13).fill("4 сек."),
        },
        {
          label: "Расход Воззвания к духам",
          values: Array(13).fill("50"),
        },
        {
          label: "Урон Воззвания к духам",
          values: [
            "129.04%",
            "138.72%",
            "148.4%",
            "161.3%",
            "170.98%",
            "180.66%",
            "193.56%",
            "206.46%",
            "219.37%",
            "232.27%",
            "245.18%",
            "258.08%",
            "274.21%",
          ],
        },
        {
          label: "Урон в падении",
          values: [
            "56.83%",
            "61.45%",
            "66.08%",
            "72.69%",
            "77.31%",
            "82.6%",
            "89.87%",
            "97.14%",
            "104.41%",
            "112.34%",
            "120.27%",
            "128.2%",
            "136.12%",
          ],
        },
        {
          label: "Низкий / высокий удар",
          values: [
            "113.63% / 141.93%",
            "122.88% / 153.49%",
            "132.13% / 165.04%",
            "145.35% / 181.54%",
            "154.59% / 193.1%",
            "165.17% / 206.3%",
            "179.7% / 224.45%",
            "194.23% / 242.61%",
            "208.77% / 260.76%",
            "224.62% / 280.57%",
            "240.48% / 300.37%",
            "256.34% / 320.18%",
            "272.19% / 339.98%",
          ],
        },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Рунная песнь: Безрассветный покой карсикко",
      icon: `${iconBase}/skill.png`,
      description:
        "**Быстрое нажатие:** **Дендро урон** вокруг себя.\n\n**Долгое нажатие:** нужна хотя бы **1 Зелёная роса**. Дендро по площади и импульс **Лунной бутонизации**; каждая потраченная Роса даёт **1** уровень **Песни луны** (до **3**). Создаётся аура **Святыни инеевой чащи** — периодический урон (АТК + МС) и снижение **Гидро/Дендро** сопротивления врагов.\n\nДлительность Святыни и Песни — **15 сек.** Откат **12 сек.** Источник: **МС**.",
      loreText: "Руны карсикко хранят покой рощи, пока луна ещё не взошла.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон быстрого нажатия",
          values: [
            "121.6%",
            "130.72%",
            "139.84%",
            "152%",
            "161.12%",
            "170.24%",
            "182.4%",
            "194.56%",
            "206.72%",
            "218.88%",
            "231.04%",
            "243.2%",
            "258.4%",
          ],
        },
        {
          label: "Урон удержания (1 удар)",
          values: [
            "158.08%",
            "169.94%",
            "181.79%",
            "197.6%",
            "209.46%",
            "221.31%",
            "237.12%",
            "252.93%",
            "268.74%",
            "284.54%",
            "300.35%",
            "316.16%",
            "335.92%",
          ],
        },
        {
          label: "Урон удержания (2 удар, за Росу)",
          values: [
            emPerDew("152"),
            emPerDew("163.4"),
            emPerDew("174.8"),
            emPerDew("190"),
            emPerDew("201.4"),
            emPerDew("212.8"),
            emPerDew("228"),
            emPerDew("243.2"),
            emPerDew("258.4"),
            emPerDew("273.6"),
            emPerDew("288.8"),
            emPerDew("304"),
            emPerDew("323"),
          ],
        },
        {
          label: "Урон Святыни инеевой чащи",
          values: [
            ae("96", "192"),
            ae("103.2", "206.4"),
            ae("110.4", "220.8"),
            ae("120", "240"),
            ae("127.2", "254.4"),
            ae("134.4", "268.8"),
            ae("144", "288"),
            ae("153.6", "307.2"),
            ae("163.2", "326.4"),
            ae("172.8", "345.6"),
            ae("182.4", "364.8"),
            ae("192", "384"),
            ae("204", "408"),
          ],
        },
        {
          label: "Длительность Святыни",
          values: Array(13).fill("15 сек."),
        },
        {
          label: "Длительность Песни луны",
          values: Array(13).fill("15 сек."),
        },
        {
          label: "Снижение сопротивления",
          values: [
            "2.5%",
            "5%",
            "7.5%",
            "10%",
            "12.5%",
            "15%",
            "17.5%",
            "20%",
            "22.5%",
            "25%",
            "28%",
            "31%",
            "34%",
          ],
        },
        {
          label: "Длительность среза RES",
          values: Array(13).fill("10 сек."),
        },
        {
          label: "Время отката",
          values: Array(13).fill("12 сек."),
        },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Рунная песнь: Сердца становятся луной",
      icon: `${iconBase}/burst.png`,
      description:
        "Священная песнь севера: **18** стаков **Сизого гимна**. Если при применении есть **Песня луны** (или она получена в течение **15 сек.** после Q), все уровни Песни обмениваются на **6** стаков гимна за каждый (один раз за ульту).\n\n**Сизый гимн:** при уроне Бутонизации / Вегетации / Цветения / Лунной бутонизации тратится **1** стак и урон растёт от **МС** Лаумы. При нескольких целях тратится по стаку на цель. Длительность стаков считается отдельно.\n\nЭнергия **60**, откат **15 сек.**",
      loreText: "Пусть желания всех живых станут лунным светом, омывающим землю.",
      levelLabels: lv13,
      stats: [
        {
          label: "Стаки Сизого гимна от Q",
          values: Array(13).fill("18"),
        },
        {
          label: "Песня луны → Сизый гимн",
          values: Array(13).fill("6 за стак"),
        },
        {
          label: "Бонус Бутонизации / Вегетации / Цветения",
          values: [
            emPct("277.76"),
            emPct("298.59"),
            emPct("319.42"),
            emPct("347.2"),
            emPct("368.03"),
            emPct("388.86"),
            emPct("416.64"),
            emPct("444.42"),
            emPct("472.19"),
            emPct("499.97"),
            emPct("527.74"),
            emPct("555.52"),
            emPct("590.24"),
          ],
        },
        {
          label: "Бонус Лунной бутонизации",
          values: [
            emPct("222.24"),
            emPct("238.91"),
            emPct("255.58"),
            emPct("277.8"),
            emPct("294.47"),
            emPct("311.14"),
            emPct("333.36"),
            emPct("355.58"),
            emPct("377.81"),
            emPct("400.03"),
            emPct("422.26"),
            emPct("444.48"),
            emPct("472.26"),
          ],
        },
        {
          label: "Длительность Сизого гимна",
          values: Array(13).fill("15 сек."),
        },
        {
          label: "Время отката",
          values: Array(13).fill("15 сек."),
        },
        {
          label: "Потребление энергии",
          values: Array(13).fill("60"),
        },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Свет для морозной ночи",
      icon: `${iconBase}/passive1.png`,
      description:
        "На **20 сек.** после Е в зависимости от **Лунного знамения**:\n\n- **Зарождающееся сияние** (только Лаума из Нод-Края): урон Бутонизации / Вегетации / Цветения может быть критическим — фикс. **15%** К/Ш и **100%** К/У (суммируется с похожими эффектами).\n- **Высшее сияние** (Лаума + ещё один герой Нод-Края): К/Ш **Лунной бутонизации** союзников рядом **+10%**, К/У **+20%**.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Омовение для родника",
      icon: `${iconBase}/passive2.png`,
      description:
        "За каждую ед. **МС**:\n- урон **Е** **+0.04%** (макс. **+32%**);\n- откат формы **Посланницы духов** сокращается на **0.02%** (макс. **−20%**).",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Дар лунного знамения: Хор природы",
      icon: `${iconBase}/passive3.png`,
      description:
        "Когда союзник вызывает **Бутонизацию**, реакция конвертируется в **Лунную бутонизацию**. Базовый урон ЛБ растёт на **0.0175%** за каждую ед. МС Лаумы (макс. **+14%**).\n\nПока она в отряде, уровень **Лунного знамения** повышается на **1**.",
      order: 5,
    },
    {
      id: "t_util",
      name: "Молитвы лесу",
      icon: `${iconBase}/utility.png`,
      description:
        "Отмечает **диковинки Нод-Края** на мини-карте. Особое взаимодействие с мелкими животными под воздействием **куувяки** (барсук, хладнорогий олень, тупорог и др.) — при контакте появляется голубой знак в виде рогов.",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "«О уста, сплетите мне песни и стихи!»",
      icon: `${cIconBase}/c1.png`,
      description:
        "После **Е** или **Q** на **20 сек.** — **Пряжа жизни**: при **Лунной бутонизации** союзников активный герой рядом восстанавливает HP на **500%** МС Лаумы (раз в **1.9 сек.**).\n\nРасход выносливости формы **Посланницы духов** **−40%**, макс. длительность **+5 сек.**\n\nПозволяет закрыть слот хилера.",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "«Прядите заветы и сказания севера»",
      icon: `${cIconBase}/c2.png`,
      description:
        "Усиливает **Сизый гимн**: Бутонизация / Вегетация / Цветение дополнительно **+500%** МС Лаумы; **Лунная бутонизация** дополнительно **+400%** МС.\n\n**Лунное знамение — Высшее сияние:** урон ЛБ отряда **+40%**.\n\nОдин из сильнейших ранних констов по баффу.",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "«Не ходи тропой хитрого лиса»",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень навыка **Рунная песнь: Безрассветный покой карсикко** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "«Не жажди могущества великого медведя»",
      icon: `${cIconBase}/c4.png`,
      description:
        "Когда атаки **Святыни инеевой чащи** поражают врагов, Лаума восстанавливает **4** ед. энергии (раз в **5 сек.**).",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "«Если можно засвидетельствовать истину»",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень навыка **Рунная песнь: Сердца становятся луной** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "«Я подношу кровь и слёзы лунному свету»",
      icon: `${cIconBase}/c6.png`,
      description:
        "Атаки **Святыни** наносят доп. Дендро по площади на **185%** МС (считается **ЛБ**, не тратит Сизый гимн, даёт **2** стака гимна и обновляет длительность; до **8** раз за Святыню). При новом **Е** такие стаки снимаются.\n\nОбычные атаки при наличии гимна тратят **1** стак и бьют Дендро на **150%** МС (ЛБ, не снимается инфузиями).\n\n**Высшее сияние:** урон ЛБ отряда **возвышается на 25%**.\n\nПревращает Лауму в полноценного саб-дд.",
      order: 5,
    },
  ];

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const existing = await prisma.character.findUnique({ where: { slug: SLUG } });

  let row;
  if (existing) {
    row = await prisma.character.update({
      where: { slug: SLUG },
      data: {
        name: NAME,
        rarity: Rarity.LEGEND,
        element: Element.DENDRO,
        weaponType: "Катализатор",
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
        element: Element.DENDRO,
        weaponType: "Катализатор",
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
