/**
 * Импорт гайда на Флинса.
 *
 *   npx tsx scripts/seed-flins-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Флинса уже корректные иконки в БД.
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

const NAME = "Флинс";
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
  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.ELECTRO;
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
    elementIcon: ELEMENT_SVG.ELECTRO,
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
    elementIcon: ELEMENT_SVG.ELECTRO,
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
      OR: [
        { slug: "flins" },
        { name: "Флинс" },
        { name: { contains: "Флинс" } },
        { name: { contains: "Кирилл" } },
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

  const SLUG = existing?.slug || "flins";
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
  const artNoch = a("Ночь открытия неба");
  const artPozol = a("Позолоченные сны");
  const artGrom = a("Громогласный рёв ярости", "Громогласный рев ярости");
  const artGlad = a("Конец гладиатора");
  const artAnsambl = a("Странствующий ансамбль");
  const artVV = a("Изумрудная тень");

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.ELECTRO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Окровавленные руины"),
      1,
      "Окровавленные руины",
      "Сигна",
      "После Q — урон Лунного заряда носителя +36% на 3.6 сек. При реакции — +28% К/У на 6 сек. и 12 ед. энергии (раз в 14 сек.).",
      "Лучший выбор: К/Ш, бафф ЛЗ и энергия под дешёвую ульту.",
      "S",
    ),
    rankedWeapon(
      w("Посох алых песков"),
      2,
      "Посох алых песков",
      "К/Ш · МС→АТК",
      "Бонус АТК от МС; стаки Сна алых песков после Е.",
      "Сильная альтернатива: К/Ш и синергия МС↔АТК под пассивы Флинса.",
      "A",
    ),
    rankedWeapon(
      w("Нефритовый коршун"),
      3,
      "Нефритовый коршун",
      "Высокая база · К/Ш",
      "Стаки АТК при попаданиях; на 7 стаках — доп. урон.",
      "Большая база и К/Ш; быстрые удары в стойке легко набирают стаки.",
      "A",
    ),
    rankedWeapon(
      w("Посох Хомы"),
      4,
      "Посох Хомы",
      "К/У · HP→АТК",
      "Бонус HP и АТК от макс. HP; доп. АТК при HP ниже 50%.",
      "Сильный К/У; с щитом Инеффы второй бонус почти не нужен.",
      "A",
    ),
    rankedWeapon(
      w("Покоритель вихря"),
      5,
      "Покоритель вихря",
      "Щит · АТК",
      "Прочность щита + стаки АТК; под щитом стаки удваиваются.",
      "Отличен со щитом Инеффы — без щита заметно слабее.",
      "A",
    ),
    rankedWeapon(
      w("Расколотый ореол"),
      6,
      "Расколотый ореол",
      "Сигна Инеффы",
      "После Е/Q — +АТК; полный бафф ЛЗ только при создании щита.",
      "Флинс щит не ставит — берёте в основном К/У и АТК.",
      "B",
    ),
    rankedWeapon(
      w("Симфонист ароматов"),
      7,
      "Симфонист ароматов",
      "К/У · АТК",
      "+АТК; доп. АТК в кармане; сильный бафф после лечения.",
      "К/У и базовая АТК полезны; хил-пассивка часто простаивает.",
      "B",
    ),
    rankedWeapon(
      w("Посох жертвующей"),
      8,
      "Посох жертвующей",
      "Лучший 4★",
      "После Е — стаки АТК и ВЭ (до 3), работает из кармана.",
      "Лучшее эпическое копьё: комфорт ВЭ и АТК; К/Ш добирает сет Ночи.",
      "A",
    ),
    rankedWeapon(
      w("Баллада фьордов"),
      9,
      "Баллада фьордов",
      "К/Ш · МС",
      "При 3 разных стихиях в отряде — большой МС.",
      "Легко активируется в тройных миксах Лунного заряда.",
      "B",
    ),
    rankedWeapon(
      w("Лопата старателя"),
      10,
      "Лопата старателя",
      "Крафт Нод-Края",
      "Усиливает Заряжен и Лунный заряд; ещё сильнее при Полнолунии.",
      "Прямой бафф реакции, но без критов сложно балансировать сборку.",
      "C",
    ),
    rankedWeapon(
      w("Небесная ось") || w("Копьё послания ветров", "Копье послания ветров"),
      11,
      "Небесная ось / Копьё послания ветров",
      "ВЭ · F2P",
      "Небесная ось — ВЭ и К/Ш; Копьё послания ветров — АТК и МС после реакций.",
      "F2P-варианты: ось закрывает ВЭ, послание ветров — крафт с АТК/МС.",
      "C",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artNoch,
      1,
      "Ночь открытия неба",
      "Лучший 4п",
      "2п +80 МС; 4п — К/Ш и урон Лунных реакций, пока носитель на поле.",
      "Сигнатурный сет мейн-дд Лунного заряда — цель почти всегда.",
      "S",
    ),
    rankedArt(
      artPozol,
      2,
      "Позолоченные сны",
      "АТК + МС",
      "2п МС; 4п — АТК/МС по составу отряда после реакции.",
      "Хорошая альтернатива, пока копите Ночь; критично добрать криты в сабах.",
      "A",
    ),
    rankedArt(
      artGrom,
      3,
      "Громогласный рёв ярости",
      "Реакции",
      "2п Электро; 4п усиливает Заряжен / Лунный заряд и др. электро-реакции.",
      "Слабее топа: Электро-кубок Флинсу не нужен, польза в основном от баффа ЛЗ.",
      "B",
    ),
    {
      id: uid(),
      rank: 4,
      name: "2+2 АТК / МС",
      image: artGlad?.image || artAnsambl?.image || artPozol?.image || STUB_IMAGE,
      rarity: 5 as const,
      href: artGlad
        ? `/wiki/artifacts/${artGlad.slug}`
        : artAnsambl
          ? `/wiki/artifacts/${artAnsambl.slug}`
          : undefined,
      subtitle: "Гладиатор + МС-сеты",
      effect:
        "2п Конец гладиатора (+18% АТК) + 2п МС (Странствующий ансамбль / Позолоченные сны / Ночь).",
      verdict: "Солянка на чистые статы без сильных сетовых баффов.",
      tier: "B",
    },
  ];

  const matShaft1 = m("Сломанный вал");
  const matShaft2 = m("Усиленный вал");
  const matShaft3 = m("Высокоточный вал");
  const matBook1 = m("Учения о «Скитании»", "Учения о «Скитание»");
  const matBook2 = m("Указания о «Скитании»", "Указания о «Скитание»");
  const matBook3 = m("Философия о «Скитании»", "Философия о «Скитание»");
  const matQueen = m(
    "Вознёсшийся образец: Ферзь",
    "Вознесшийся образец: Ферзь",
    "Вознесший образец: Ферзь",
  );

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такой Флинс",
      body: `**Кирилл Чудомирович Флинс** — **Электро-копьё 5★** из фракции **Светоносцы** (Нод-Край). Роль — **мейн-дд** через **Лунный заряд**: стойка **Явление пламени**, усиленный навык **Шторм северных копий** и дешёвая ульта **Громогласная симфония**.

### Кратко
- **Рейтинг** — S+
- **Титул** — Shadowy Lights, Stranger Wights · фракция **Светоносцы**
- **Стихия / оружие** — Электро · копьё
- **Возвышение** — крит. урон (**+38.4%**, итого ~**88.4%** на 90 ур.)
- **База на 90 ур.** — HP **12 491** · АТК **352** · Защита **809** · К/У **50% + 38.4%**
- **Баннер** — «Одинокий свет в ночи»; сигна — **Окровавленные руины**
- **День рождения** — 31 октября
- **Получение** — молитва события
- **Регион / фракция** — Нод-Край · Светоносцы
- **Созвездие** — Ночной Фонарь (Laterna Vigilis)
- **Особое блюдо** — **Озарение долгой ночи**
- **Именная карта** — Фонарь Хранителя клятвы
- **Озвучка** — EN Nic Olsen · JP Nakamura Yu · CN Ma Zhengyang · KR Shin Yong-woo
- **Лунное знамение** — +1, пока он в отряде

Лучший партнёр — **Инеффа** (~**+40%** командного урона). Нужен союзник **Нод-Края** для **Высшего сияния** и стабильный **Гидро**-аппликатор.`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Сам вводит и усиливает **Лунный заряд** — меньше зависимости от сторонних бафферов реакции.",
        "Понятная сборка: **АТК**, криты и немного **ВЭ**; МС добирается конвертацией АТК.",
        "Большой выбор оружия — сильна не только сигна.",
        "Дешёвая **Громогласная симфония** (30 энергии) — ядро ротации и основной урон.",
      ],
      cons: [
        "Узкие команды: нужен **Гидро**-статус и герой **Нод-Края** для знамения; топ раскрывается с **Инеффой** (~+40%).",
        "Сильно зависит от **С1 / С2 / С6** — энергия, откаты и срез резистов.",
        "В стойке всё ещё сбивается сильными ударами — желателен щит или хил.",
        "Без Гидро-аппа и Высшего сияния теряет большую часть ценности.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Флинса",
      body: `Сборка под **мейн-дд Лунного заряда** на поле. Урон реакции критует — нужны **криты** и **АТК** (пассивка переливает АТК в МС). Кубок на **Электро не берите**: личный элементальный урон вторичен.

Приоритет: **АТК → криты → ВЭ → немного МС**. Пески — **АТК%** или **МС**; кубок — **АТК%**; корона — **К/Ш** или **К/У**. В сабах: **АТК% · ВЭ% · МС · криты**. С сетом **Ночь открытия неба** К/Ш в цели ниже — сет уже даёт шанс.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro: "Порог **2000 АТК** нужен для полной отдачи пассивок; ВЭ — под две дешёвые ульты за стойку.",
      targets: [
        {
          id: uid(),
          label: "АТК",
          value: "2000+",
          hint: "Порог для Шепчущего пламени и баффа ЛЗ от АТК",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "130–140%",
          hint: "С С1 и сигной достаточно 110–120%",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "40–50%",
          hint: "С 4п Ночи открытия неба",
        },
        {
          id: uid(),
          label: "К/У",
          value: "160%+",
          hint: "С учётом возвышения и оружия",
        },
        {
          id: uid(),
          label: "МС",
          value: "100–200",
          hint: "Без учёта собственного перелива АТК→МС и баффов союзников",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "АТК% / МС", subs: "АТК% · ВЭ% · МС · криты" },
        { id: uid(), slot: "Кубок", main: "АТК% (не Электро)", subs: "АТК% · ВЭ% · МС · криты" },
        { id: uid(), slot: "Корона", main: "К/Ш / К/У", subs: "АТК% · ВЭ% · МС · криты" },
        {
          id: uid(),
          slot: "Цветок / Перо",
          main: "HP / АТК",
          subs: "АТК% · ВЭ% · МС · криты",
        },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите **криты**, **АТК** и баффы под **Лунный заряд**. Сигна сильнее топ-легендарок примерно на **15%**; лучший 4★ — **Посох жертвующей**.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Цель — **4п Ночь открытия неба**. Альтернативы заметно слабее; 2+2 АТК/МС — временная солянка на статы.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в Лунном заряде",
      intro: "Ориентир для команд Флинс + Инеффа + Гидро Нод-Края + Анемо.",
      groups: [
        {
          id: uid(),
          title: "Лунный заряд",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Ночь открытия неба",
              setImage: artImg(artNoch, "Ночь открытия неба"),
            },
            planRow(
              c("ineffa", "инеффа"),
              "Инеффа",
              "Рассвет / Серенада",
              artImg(artRassvet, "Рассветная песнь звезды и луны"),
            ),
            planRow(
              c("kolombina", "коломбина") || c("ajno", "айно"),
              "Коломбина / Айно",
              "Серенада / Рассвет",
              artImg(artSerenada, "Серенада шёлковой луны"),
            ),
            planRow(
              c("sucrose", "сахароза"),
              "Сахароза",
              "Изумрудная тень",
              artImg(artVV, "Изумрудная тень"),
            ),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Лунный заряд",
      body: `Ядро — **Флинс (мейн) + Гидро-аппликатор + слот Нод-Края**. Лучшие команды строятся вокруг **Инеффы** (щит, карманный Электро, бафф ЛЗ). Без неё отряды слабее примерно на **40%**.

Нужен хотя бы один герой **Нод-Края** для **Высшего сияния**. Второй Электро помогает с энергией. Дендро обычно мешает статусам.`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Флинса:",
      rows: [
        roleRow(
          c("ineffa", "инеффа"),
          "Инеффа",
          "Копьё",
          "Топ-1 партнёр: щит, Лунный заряд, энергия и ~+40% командного урона.",
        ),
        roleRow(
          c("kolombina", "коломбина"),
          "Коломбина",
          "Катализатор",
          "Лучший Гидро-саппорт Нод-Края: статус, бафф реакции и личный урон.",
        ),
        roleRow(
          c("ajno", "айно"),
          "Айно",
          "Двуручный меч",
          "Бесплатный Гидро + уровень знамения; альтернатива Коломбине.",
        ),
        roleRow(
          c("sucrose", "сахароза"),
          "Сахароза",
          "Катализатор",
          "МС отряду, стяжка и срез резистов через Изумрудную тень.",
        ),
        roleRow(
          c("yagoda", "ягода"),
          "Ягода",
          "Лук",
          "Слот Нод-Края + Анемо-поддержка, если Сахароза/Айно заняты.",
        ),
        roleRow(
          c("yelan", "е лань", "e-lan"),
          "Е Лань",
          "Лук",
          "Карманный Гидро и бафф урона, когда нет Коломбины.",
        ),
        roleRow(
          c("furina", "фурина"),
          "Фурина",
          "Меч",
          "Стабильный Гидро-статус; Фанфары менее критичны для ЛЗ.",
        ),
        roleRow(
          c("fischl", "фишль"),
          "Фишль",
          "Лук",
          "Энергия и карманный Электро без Инеффы.",
        ),
        roleRow(
          c("ororon", "оророн"),
          "Оророн",
          "Лук",
          "Резонанс и подкачка из кармана; сильнее на высоких констах.",
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
          "Сигнатурный Лунный заряд: Коломбина или Айно на статус и знамение, Сахароза на МС и срез.",
          [
            self("Мейн-дд"),
            member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд / щит"),
            member(
              c("kolombina", "коломбина") || c("ajno", "айно"),
              "Коломбина / Айно",
              "Гидро",
            ),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
          ],
          "Топ",
        ),
        variant(
          "Без Коломбины: Е Лань или Фурина на Гидро, Сахароза на бафф и резисты.",
          [
            self("Мейн-дд"),
            member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд / щит"),
            member(c("yelan", "е лань") || c("furina", "фурина"), "Е Лань / Фурина", "Гидро"),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
          ],
          "Топ",
        ),
        variant(
          "Гео вместо Анемо: Коломбина на статус, Шилонен на срез и комфорт.",
          [
            self("Мейн-дд"),
            member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд / щит"),
            member(c("kolombina", "коломбина"), "Коломбина", "Гидро"),
            member(c("shilonen", "шилонен", "xilonen"), "Шилонен", "Бафф"),
          ],
          "Альтернатива",
        ),
        variant(
          "Без Инеффы: Коломбина + Сахароза; Дори или Куки закрывают резонанс, энергию и хил.",
          [
            self("Мейн-дд"),
            member(c("kolombina", "коломбина"), "Коломбина", "Гидро"),
            member(c("sucrose", "сахароза"), "Сахароза", "Анемо"),
            member(c("dori", "дори") || c("kuki", "синобу", "куки"), "Дори / Куки", "Электро / хил"),
          ],
          "Без Инеффы",
        ),
        variant(
          "Айно на знамение и статус, Фишль на энергию, Ягода на Анемо/Нод-Край.",
          [
            self("Мейн-дд"),
            member(c("ajno", "айно"), "Айно", "Гидро"),
            member(c("fischl", "фишль"), "Фишль", "Электро"),
            member(c("yagoda", "ягода"), "Ягода", "Анемо"),
          ],
          "Альтернатива",
        ),
        variant(
          "Бюджет из бесплатных: Айно + Барбара на Гидро/хил, Линетт или Сахароза на срез.",
          [
            self("Мейн-дд"),
            member(c("ajno", "айно"), "Айно", "Гидро"),
            member(c("barbara", "барбара"), "Барбара", "Хил"),
            member(
              c("linett", "линетт") || c("sucrose", "сахароза"),
              "Линетт / Сахароза",
              "Анемо",
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
      intro: "Ресурсы для возвышения Флинса (материалы Нод-Края + аметист Ваджрада):",
      rows: [
        {
          id: uid(),
          name: m("Осколок аметиста Ваджрада")?.name || "Аметист Ваджрада",
          image: m("Осколок аметиста Ваджрада")?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия аметиста Ваджрада)",
          href: m("Осколок аметиста Ваджрада")
            ? `/wiki/materials/${m("Осколок аметиста Ваджрада")!.slug}`
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
          name: m("Штамповочная форма куувяки")?.name || "Штамповочная форма куувяки",
          image: m("Штамповочная форма куувяки")?.image || "",
          qty: "46",
          where: "Мировой босс «Железный утёнок»",
          href: m("Штамповочная форма куувяки")
            ? `/wiki/materials/${m("Штамповочная форма куувяки")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Инеевый цветок")?.name || "Инеевый цветок",
          image: m("Инеевый цветок")?.image || "",
          qty: "168",
          where: "Диковинка Нод-Края",
          href: m("Инеевый цветок") ? `/wiki/materials/${m("Инеевый цветок")!.slug}` : undefined,
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
          name: matQueen?.name || "Вознёсшийся образец: Ферзь",
          image: matQueen?.image || "",
          rarity: 5 as const,
          note: "×4",
          qty: "4",
          href: matQueen ? `/wiki/materials/${matQueen.slug}` : undefined,
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
        "Растёт **крит. урон** (**+38.4%** на 90 ур., итого ~**88.4%** с базовыми 50%). Качайте до **90** — уровень участников реакции важен для Лунного заряда.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/У",
        "Бонус К/У (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "972", "27", "63", "50%", "0%"),
        emptyStatsRow("20", "2 522", "71", "163", "50%", "0%"),
        emptyStatsRow("40", "5 022", "141", "325", "50%", "0%"),
        emptyStatsRow("50", "6 459", "182", "418", "50%", "9.6%"),
        emptyStatsRow("60", "8 103", "228", "524", "50%", "19.2%"),
        emptyStatsRow("70", "9 557", "269", "619", "50%", "19.2%"),
        emptyStatsRow("80", "11 020", "310", "713", "50%", "28.8%"),
        emptyStatsRow("90", "12 491", "352", "809", "50%", "38.4%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Флинс — полевой мейн через стойку **Явление пламени**. Первая **Е** включает инфузию; усиленная **Е** (**Шторм северных копий**) на 6 сек. меняет ульту на дешёвую **Громогласную симфонию** (30 энергии) — основной источник урона Лунного заряда. Полную ульту на 80 энергии в обычной ротации почти не жмут.

### Приоритет прокачки
**Е > Q > обычные** (обычные вне стойки почти не нужны; в стойке скейлы идут от навыка).

### Активные навыки
- **Демоническое копьё** — до 5 ударов копьём; заряженная — бросок; падение — урон по площади.
- **Древний обряд: Тайный свет (Е)** — режим **Явление пламени** (10 сек.): Электро-инфузия, сопротивление прерыванию, навык сменяется на **Шторм северных копий** (AoE Электро, откат 6 сек., включает дешёвую ульту).
- **Древний ритуал: Наступает ночь (Q)** — AoE Электро + этапы Лунного заряда (**80** энергии). После Шторма — **Громогласная симфония** (**30** энергии). При **Высшем сиянии** и грозовых тучах — доп. удары.

### Пассивки
- **Дар лунного знамения: Секреты старого мира** — Заряжен → Лунный заряд; +0.7% базового урона ЛЗ за 100 АТК (макс. **14%**); **+1** к уровню Знамения.
- **Симфония зимы** — при Высшем сиянии урон Лунного заряда Флинса **+20%**.
- **Шепчущее пламя** — МС = **8%** АТК (макс. **160**).
- **Свет во тьме** — отмечает диковинки Нод-Края на мини-карте.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Саппорты / саб-дд — баффы и **Гидро**-статус.
2. **Е** Флинса — вход в **Явление пламени**, один обычный удар.
3. Усиленная **Е** (**Шторм северных копий**) — включает **Громогласную симфонию**.
4. Дешёвая **Q** → обычные под инфузией до отката Шторма.
5. Снова Шторм → вторая дешёвая **Q** → короткий финиш и смена.

> Порядок: **баффы → Е → Шторм → Q → NA → Шторм → Q**. Дорогую ульту на 80 энергии обычно пропускайте.

### Стоит ли выбивать?
Сильный **S+** мейн-дд Лунного заряда. Сборка простая, но команды узкие: лучше уже иметь или планировать **Инеффу** и/или **Коломбину** (Айно — бюджетная замена Гидро).

### С1 или сигна?
- **С1** чаще приоритетнее: ещё одна дешёвая ульта за ротацию + энергия от Лунного заряда.
- **Сигна (Окровавленные руины)** — если нет сильной легендарки на замену; даёт К/Ш, бафф ЛЗ и энергию.

### Инеффа или Коломбина?
Берите **Инеффу**: её сложнее заменить (щит, бафф ЛЗ, карман, резонанс). У Коломбины есть **Айно**. В идеале — обе в топ-команде.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `**Кирилл Чудомирович Флинс** — светоносец Нод-Края, смотритель маяка и кладбища на северном острове. Таинственный джентльмен с безупречными манерами; охраняет могилу отца, тоже бывшего светоносцем, и противостоит **Дикой Охоте**.

Созвездие **Ночной Фонарь**, особое блюдо **Озарение долгой ночи** и именная карта **Фонарь Хранителя клятвы** подчёркивают образ фонаря во тьме. С ним связаны задания вроде «Клятва Светоносцев» и цепочки на Кладбище ночи.`,
    },
  ];

  if (!matBook1) noteMissing("material", "Учения о «Скитании»");
  if (!matBook2) noteMissing("material", "Указания о «Скитании»");
  if (!matBook3) noteMissing("material", "Философия о «Скитании»");
  if (!matQueen) noteMissing("material", "Вознёсшийся образец: Ферзь");

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Инеевый цветок"), "Инеевый цветок", 168, "local", 1),
    matCard(m("Штамповочная форма куувяки"), "Штамповочная форма куувяки", 46, "boss", 4),
    matCard(m("Осколок аметиста Ваджрада"), "Осколок аметиста Ваджрада", 1, "ascension", 2),
    matCard(m("Фрагмент аметиста Ваджрада"), "Фрагмент аметиста Ваджрада", 9, "ascension", 3),
    matCard(m("Кусок аметиста Ваджрада"), "Кусок аметиста Ваджрада", 9, "ascension", 4),
    matCard(m("Драгоценный аметист Ваджрада"), "Драгоценный аметист Ваджрада", 6, "ascension", 5),
    matCard(matShaft1, "Сломанный вал", 18, "ascension", 1),
    matCard(matShaft2, "Усиленный вал", 30, "ascension", 2),
    matCard(matShaft3, "Высокоточный вал", 36, "ascension", 3),
    matCard(matBook1, "Учения о «Скитании»", 9, "talent", 2),
    matCard(matBook2, "Указания о «Скитании»", 63, "talent", 3),
    matCard(matBook3, "Философия о «Скитании»", 114, "talent", 4),
    matCard(matQueen, "Вознёсшийся образец: Ферзь", 12, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Флинс — Электро мейн-дд Лунного заряда: билд, оружие, сеты и отряды.";

  const iconBase = "/images/talents/flins";
  const cIconBase = "/images/constellations/flins";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const talents = [
    {
      id: "t_na",
      name: "Демоническое копьё",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до пяти последовательных ударов копьём.\n\n**Заряженная:** тратит выносливость и бросает копьё вперёд.\n\n**Удар в падении:** стремительное падение, затем урон по площади.",
      loreText: "Фонарь и копьё — два края одной клятвы.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон 1 удара",
          values: [
            "44.73%",
            "48.37%",
            "52.01%",
            "57.21%",
            "60.85%",
            "65.01%",
            "70.73%",
            "76.45%",
            "82.17%",
            "88.41%",
            "94.65%",
            "100.89%",
            "107.13%",
          ],
        },
        {
          label: "Урон 2 удара",
          values: [
            "45.15%",
            "48.82%",
            "52.5%",
            "57.75%",
            "61.42%",
            "65.62%",
            "71.4%",
            "77.17%",
            "82.95%",
            "89.25%",
            "95.55%",
            "101.85%",
            "108.15%",
          ],
        },
        {
          label: "Урон 3 удара",
          values: [
            "55.92%",
            "60.47%",
            "65.02%",
            "71.53%",
            "76.08%",
            "81.28%",
            "88.43%",
            "95.58%",
            "102.74%",
            "110.54%",
            "118.34%",
            "126.14%",
            "133.95%",
          ],
        },
        {
          label: "Урон 4 удара",
          values: [
            "32.04%×2",
            "34.65%×2",
            "37.25%×2",
            "40.98%×2",
            "43.59%×2",
            "46.57%×2",
            "50.67%×2",
            "54.76%×2",
            "58.86%×2",
            "63.33%×2",
            "67.8%×2",
            "72.27%×2",
            "76.74%×2",
          ],
        },
        {
          label: "Урон 5 удара",
          values: [
            "76.79%",
            "83.05%",
            "89.3%",
            "98.23%",
            "104.48%",
            "111.62%",
            "121.44%",
            "131.27%",
            "141.09%",
            "151.8%",
            "162.52%",
            "173.23%",
            "183.95%",
          ],
        },
        {
          label: "Урон заряженной атаки",
          values: [
            "103.03%",
            "111.41%",
            "119.8%",
            "131.78%",
            "140.17%",
            "149.75%",
            "162.93%",
            "176.11%",
            "189.28%",
            "203.66%",
            "218.04%",
            "232.41%",
            "246.79%",
          ],
        },
        {
          label: "Расход выносливости",
          values: Array(13).fill("25"),
        },
        {
          label: "Урон в падении",
          values: [
            "63.93%",
            "69.14%",
            "74.34%",
            "81.77%",
            "86.98%",
            "92.93%",
            "101.1%",
            "109.28%",
            "117.46%",
            "126.38%",
            "135.3%",
            "144.22%",
            "153.14%",
          ],
        },
        {
          label: "Низкий / высокий удар",
          values: [
            "127.84% / 159.68%",
            "138.24% / 172.67%",
            "148.65% / 185.67%",
            "163.51% / 204.24%",
            "173.92% / 217.23%",
            "185.81% / 232.09%",
            "202.16% / 252.51%",
            "218.51% / 272.93%",
            "234.86% / 293.36%",
            "252.7% / 315.64%",
            "270.54% / 337.92%",
            "288.38% / 360.2%",
            "306.22% / 382.48%",
          ],
        },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Древний обряд: Тайный свет",
      icon: `${iconBase}/skill.png`,
      description:
        "Флинс переходит в режим **Явления пламени**: обычные и заряженные атаки наносят **Электро** (нельзя отменить другой инфузией), атаки в падении недоступны, сопротивление прерыванию повышается. Навык сменяется на **Шторм северных копий**.\n\n**Шторм северных копий:** град копий — Электро по площади; на **6 сек.** ульта сменяется на **Громогласную симфонию**. Базовый откат Шторма — **6 сек.** Длительность стойки — **10 сек.** Откат навыка — **16 сек.**",
      loreText: "Тайный свет фонаря будит северный шторм.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон Шторма северных копий",
          values: [
            "178.4%",
            "191.78%",
            "205.16%",
            "223%",
            "236.38%",
            "249.76%",
            "267.6%",
            "285.44%",
            "303.28%",
            "321.12%",
            "338.96%",
            "356.8%",
            "379.1%",
          ],
        },
        {
          label: "Откат Шторма северных копий",
          values: Array(13).fill("6 сек."),
        },
        {
          label: "Длительность Явления пламени",
          values: Array(13).fill("10 сек."),
        },
        {
          label: "Время отката",
          values: Array(13).fill("16 сек."),
        },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Древний ритуал: Наступает ночь",
      icon: `${iconBase}/burst.png`,
      description:
        "Флинс высвобождает силу фонаря: **Электро** по площади, затем 2 промежуточных и 1 финальный этап урона, считающегося **Лунным зарядом**. При **Высшем сиянии** и грозовых тучах — 2 доп. промежуточных этапа.\n\nПосле **Шторма северных копий** ульта на **6 сек.** сменяется на **Громогласную симфонию** (дешевле по энергии): 1 удар Лунного заряда; при Высшем сиянии — ещё один.\n\nЭнергия **80** / симфония **30**. Откат **20 сек.**",
      loreText: "Ночь наступает — и симфония грома отвечает.",
      levelLabels: lv13,
      stats: [
        {
          label: "Исходный урон навыка",
          values: [
            "259.84%",
            "279.33%",
            "298.82%",
            "324.8%",
            "344.29%",
            "363.78%",
            "389.76%",
            "415.74%",
            "441.73%",
            "467.71%",
            "493.7%",
            "519.68%",
            "552.16%",
          ],
        },
        {
          label: "Урон промежуточного этапа Лунного заряда",
          values: [
            "16.24%",
            "17.46%",
            "18.68%",
            "20.3%",
            "21.52%",
            "22.74%",
            "24.36%",
            "25.98%",
            "27.61%",
            "29.23%",
            "30.86%",
            "32.48%",
            "34.51%",
          ],
        },
        {
          label: "Урон финального этапа Лунного заряда",
          values: [
            "116.93%",
            "125.7%",
            "134.47%",
            "146.16%",
            "154.93%",
            "163.7%",
            "175.39%",
            "187.08%",
            "198.78%",
            "210.47%",
            "222.16%",
            "233.86%",
            "248.47%",
          ],
        },
        {
          label: "Урон Громогласной симфонии",
          values: [
            "71.46%",
            "76.82%",
            "82.17%",
            "89.32%",
            "94.68%",
            "100.04%",
            "107.18%",
            "114.33%",
            "121.48%",
            "128.62%",
            "135.77%",
            "142.91%",
            "151.84%",
          ],
        },
        {
          label: "Доп. урон Громогласной симфонии",
          values: [
            "103.94%",
            "111.73%",
            "119.53%",
            "129.92%",
            "137.72%",
            "145.51%",
            "155.9%",
            "166.3%",
            "176.69%",
            "187.08%",
            "197.48%",
            "207.87%",
            "220.86%",
          ],
        },
        {
          label: "Потребление энергии",
          values: Array(13).fill("80"),
        },
        {
          label: "Энергия Громогласной симфонии",
          values: Array(13).fill("30"),
        },
        {
          label: "Время отката",
          values: Array(13).fill("20 сек."),
        },
      ],
      order: 2,
    },
    {
      id: "t_p1",
      name: "Дар лунного знамения: Секреты старого мира",
      icon: `${iconBase}/passive1.png`,
      description:
        "Реакция **Заряжен** союзников конвертируется в **Лунный заряд**. Базовый урон ЛЗ +**0.7%** за каждые **100** АТК Флинса (макс. **+14%**).\n\nПока он в отряде, уровень **Лунного знамения** +**1**.",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Симфония зимы",
      icon: `${iconBase}/passive2.png`,
      description:
        "При **Лунном знамении — Высшее сияние** урон реакции **Лунный заряд** Флинса увеличивается на **20%**.",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Шепчущее пламя",
      icon: `${iconBase}/passive3.png`,
      description:
        "Мастерство стихий Флинса повышается на **8%** от его силы атаки (макс. **160** ед.).",
      order: 5,
    },
    {
      id: "t_util",
      name: "Свет во тьме",
      icon: `${iconBase}/utility.png`,
      description:
        "Отмечает диковинки Нод-Края на мини-карте. Кроме того, Флинс понимает, о чём шепчет Дикая Охота…",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Отстраняя снежную завесу",
      icon: `${cIconBase}/c1.png`,
      description:
        "Базовый откат **Шторма северных копий** сокращается до **4 сек.** Когда отряд вызывает **Лунный заряд**, Флинс восстанавливает **8** ед. энергии (раз в **5.5 сек.**).",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "Стена дьявола",
      icon: `${cIconBase}/c2.png`,
      description:
        "На **6 сек.** после **Шторма северных копий** следующая обычная атака наносит доп. Электро по площади на **50%** АТК (считается Лунным зарядом).\n\nПри **Высшем сиянии**, пока Флинс на поле, его Электро-атаки снижают Электро сопротивление врага на **25%** на **7 сек.**",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Путник в ночи",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень навыка **Древний ритуал: Наступает ночь** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Ночь на Лысой горе",
      icon: `${cIconBase}/c4.png`,
      description:
        "Сила атаки Флинса +**20%**. **Шепчущее пламя** усиливается: МС = **10%** АТК (макс. **220**).",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "Тень изгнанника",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень навыка **Древний обряд: Тайный свет** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Песни и пляски смерти",
      icon: `${cIconBase}/c6.png`,
      description:
        "Урон **Лунного заряда** Флинса +**35%**. При **Высшем сиянии** урон Лунного заряда всех членов отряда поблизости +**10%**.",
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
        element: Element.ELECTRO,
        weaponType: "Копьё",
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
        element: Element.ELECTRO,
        weaponType: "Копьё",
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
