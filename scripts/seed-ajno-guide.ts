/**

 * Импорт гайда на Айно.

 *

 *   npx tsx scripts/seed-ajno-guide.ts

 *

 * Важно: НЕ трогаем image / splashImage — у Айно уже корректные иконки в БД.

 */

import fs from "fs";

import path from "path";

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



const NAME = "Айно";

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

  return ELEMENT_SVG[String(element) as ElementKey] || ELEMENT_SVG.HYDRO;

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

    rarity: 4,

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

    elementIcon: ELEMENT_SVG.HYDRO,

    rarity: 4,

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

    elementIcon: ELEMENT_SVG.HYDRO,

    weapon,

    weaponIcon: "",

    description: `${description} (заглушка — нет в БД)`,

    rarity: 4,

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



/** Из scripts/_tmp-aino-talent-values.json или запасной хардкод. */

function loadTalentValues(): TalentValues {

  const jsonPath = path.join(__dirname, "_tmp-aino-talent-values.json");

  if (fs.existsSync(jsonPath)) {

    return JSON.parse(fs.readFileSync(jsonPath, "utf8")) as TalentValues;

  }

  return {

    na: [

      ["66.5%", "71.9%", "77.3%", "85.1%", "90.5%", "96.7%", "105.2%", "113.7%", "122.2%", "131.5%", "140.7%", "150%", "159.3%"],

      ["66.2%", "71.6%", "77%", "84.7%", "90.1%", "96.2%", "104.7%", "113.1%", "121.6%", "130.8%", "140.1%", "149.3%", "158.6%"],

      ["49.2% ×2", "53.2% ×2", "57.2% ×2", "63% ×2", "67% ×2", "71.5% ×2", "77.8% ×2", "84.1% ×2", "90.4% ×2", "97.3% ×2", "104.2% ×2", "111% ×2", "117.9% ×2"],

      ["62.5%", "67.6%", "72.7%", "80%", "85.1%", "90.9%", "98.9%", "106.9%", "114.9%", "123.6%", "132.3%", "141%", "149.8%"],

      ["113.1%", "122.3%", "131.5%", "144.6%", "153.9%", "164.4%", "178.8%", "193.3%", "207.8%", "223.6%", "239.3%", "255.1%", "270.9%"],

      Array(13).fill("40/сек."),

      Array(13).fill("5 сек."),

      ["74.6%", "80.7%", "86.7%", "95.4%", "101.5%", "108.4%", "118%", "127.5%", "137%", "147.4%", "157.8%", "168.3%", "178.7%"],

      [

        "149.1% / 186.3%",

        "161.3% / 201.5%",

        "173.4% / 216.6%",

        "190.8% / 238.3%",

        "202.9% / 253.4%",

        "216.8% / 270.8%",

        "235.9% / 294.6%",

        "254.9% / 318.4%",

        "274% / 342.3%",

        "294.8% / 368.2%",

        "315.6% / 394.2%",

        "336.4% / 420.2%",

        "357.3% / 446.2%",

      ],

    ],

    sk: [

      ["65.6%", "70.5%", "75.4%", "82%", "86.9%", "91.8%", "98.4%", "105%", "111.5%", "118.1%", "124.6%", "131.2%", "139.4%"],

      ["188.8%", "203%", "217.1%", "236%", "250.2%", "264.3%", "283.2%", "302.1%", "321%", "339.8%", "358.7%", "377.6%", "401.2%"],

      Array(13).fill("10 сек."),

    ],

    bu: [

      ["20.1%", "21.6%", "23.1%", "25.1%", "26.6%", "28.2%", "30.2%", "32.2%", "34.2%", "36.2%", "38.2%", "40.2%", "42.7%"],

      Array(13).fill("14 сек."),

      Array(13).fill("13.5 сек."),

      Array(13).fill("50"),

    ],

  };

}



async function main() {

  const existing = await prisma.character.findUnique({
    where: { slug: "ajno" },
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

  const SLUG = "ajno";

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



  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");

  const artCvetok = a("Цветок потерянного рая");

  const artInstruktor = a("Инструктор");

  const artStranstv = a("Странствующий ансамбль");

  const artPozol = a("Позолоченные сны");

  const artNoch = a("Ночь открытия неба");

  const artRassvet = a("Рассветная песнь звезды и луны");

  const artVV = a("Изумрудная тень");



  const self = (role?: string): GuideTeamMember => ({

    id: uid(),

    name: NAME,

    image: IMAGE,

    elementIcon: ELEMENT_SVG.HYDRO,

    rarity: 4,

    href: `/wiki/characters/${SLUG}`,

    role,

  });



  const weaponItems: GuideRankedItem[] = [

    rankedWeapon(

      w("Выкованное пламенем озарение"),

      1,

      "Выкованное пламенем озарение",

      "Сигна · МС + ВЭ",

      "МС и энергия после заряженной, Лунного заряда или Бутонизации.",

      "Лучший выбор: статы и пассивка под Гидро-саппорт Лунных реакций.",

      "A",

    ),

    rankedWeapon(

      w("Мастер-ключ"),

      2,

      "Мастер-ключ",

      "Крафт F2P",

      "ВЭ и МС под Знамение «Восходящее сияние»; усиление при активном эффекте.",

      "Лучший бесплатный крафт: закрывает энергию и мастерство.",

      "A",

    ),

    rankedWeapon(

      w("Аквамарин Махайры"),

      3,

      "Аквамарин Махайры",

      "МС → АТК отряду",

      "Часть МС конвертируется в АТК активного — сильно для Флинса и Инеффы.",

      "Отличная легендарка, если команда качает АТК мейн-дд.",

      "A",

    ),

    rankedWeapon(

      w("Двуручный меч Фавония"),

      4,

      "Двуручный меч Фавония",

      "Батарея · ВЭ",

      "Генерирует частицы при критах; помогает ульте и отряду.",

      "Нужны криты в сборке; зато комфортная энергия соло-Гидро.",

      "A",

    ),

    rankedWeapon(

      w("Цветок в латах"),

      5,

      "Цветок в латах",

      "Ивент · МС",

      "МС в саб-стате; пассивка на реакции после навыка.",

      "Сильный ивентовый эпик, пока нет сигны или крафта.",

      "B",

    ),

    rankedWeapon(

      w("Церемониальный двуручный меч"),

      6,

      "Церемониальный двуручный меч",

      "Ранний · ВЭ",

      "ВЭ% и быстрее ульта после попаданий навыком.",

      "Стартовый вариант, пока нет лучшего оружия.",

      "B",

    ),

    rankedWeapon(

      w("Регалия леса"),

      7,

      "Регалия леса",

      "Дендро / Лунная бутонизация",

      "МС и бонус реакций после навыка; подходит в ЛБ-командах.",

      "Хорошо в отрядах с Нефер / Нахидой / Лаумой.",

      "B",

    ),

  ];



  const artEmPiece =

    artStranstv || artPozol || artCvetok || artNoch;

  if (!artEmPiece) noteMissing("artifact", "2+2 МС сеты");



  const artItems: GuideRankedItem[] = [

    rankedArt(

      artSerenada,

      1,

      "Серенада шёлковой луны",

      "Лучший 4п",

      "2п +80 МС; 4п — ВЭ и бафф МС / урона реакций союзникам после Е.",

      "Сигнатурный сет саппорта Нод-Края: энергия и команда.",

      "S",

    ),

    rankedArt(

      artCvetok,

      2,

      "Цветок потерянного рая",

      "С Нилу · бутонизация",

      "2п +80 МС; 4п усиливает Бутонизацию стаками после реакций.",

      "Альтернатива в классических bloom-командах с Нилу.",

      "A",

    ),

    rankedArt(

      artInstruktor,

      3,

      "Инструктор",

      "Бюджет · МС отряду",

      "4п: после реакции +120 МС отряду на 8 сек.",

      "Дешёвый сет для старта; один носитель в отряде.",

      "A",

    ),

    {

      id: uid(),

      rank: 4,

      name: "2+2 МС (Странствующий / Позолоченные / Цветок / Ночь)",

      image: artEmPiece?.image || STUB_IMAGE,

      rarity: 5 as const,

      href: artEmPiece ? `/wiki/artifacts/${artEmPiece.slug}` : undefined,

      subtitle: "2+2 МС",

      effect: "Каждые 2 части: +80 МС.",

      verdict: "Временная солянка, пока нет 4п Серенады или Цветка.",

      tier: "B",

    },

  ];



  const matShaft1 = m("Сломанный вал");

  const matShaft2 = m("Усиленный вал");

  const matShaft3 = m("Высокоточный вал");

  const matBook1 = m("Учения о «Рае»");

  const matBook2 = m("Указания о «Рае»");

  const matBook3 = m("Философия о «Рае»");

  const matLaz1 = m("Осколок лазурита Варунада");

  const matLaz2 = m("Фрагмент лазурита Варунада");

  const matLaz3 = m("Кусок лазурита Варунада");

  const matLaz4 = m("Драгоценный лазурит Варунада");

  const matBoss = m("Штамповочная форма куувяки");

  const matBearing = m("Переносной подшипник");

  const matSilk = m("Шелковистое перо", "Шёлковое перо", "Шелковое перо");

  const matCrown = m("Корона прозрения");



  const blocks: GuideBlock[] = [

    {

      id: uid(),

      type: "text",

      eyebrow: "Обзор",

      title: "Кто такая Айно",

      body: `Айно — **Гидро двуручник 4★** из мастерской крумкаке **«Дзынь-Клац»** (Нод-Край). Роль — **Гидро-аппликатор и саппорт Лунных реакций**: стабильный водяной статус, зона охлаждения от ульты и **+1** к уровню **Лунного знамения**.



### Кратко

- **Рейтинг** — A

- **Стихия / оружие** — Гидро · двуручник

- **Возвышение** — МС (**+96** на 90 ур.)

- **База на 90 ур.** — HP **11 201** · АТК **242** · Защита **607** · бонус МС **96**

- **Добавлена** — патч **6.0** (бесплатно из квеста; с **6.1** — стандартная молитва)

- **День рождения** — 21 сентября

- **Регион / фракция** — Нод-Край · Мастерская крумкаке «Дзынь-Клац»

- **Созвездие** — Грохочущий Ларец

- **Особое блюдо** — **Кондитерский стаканчик Дзынь-Клац**

- **Именная карточка** — **Айно: Утиная оплошность**`,

    },

    {

      id: uid(),

      type: "prosCons",

      eyebrow: "Анализ",

      title: "Преимущества и недостатки",

      prosTitle: "Преимущества",

      consTitle: "Недостатки",

      pros: [

        "**Бесплатный 4★ Гидро** Нод-Края — редкий аппликатор для Лунного заряда / бутонизации / кристалла.",

        "Пассивка **Дар лунного знамения** даёт **+1** к знамению — проще **Высшее сияние** без второй легендарки.",

        "Простая EM-сборка: **МС + ВЭ**, криты вторичны; **Серенада шёлковой луны** усиливает всю команду.",

        "**С6** сильно баффает Заряжен / Бутонизацию / Лунный заряд / Лунную бутонизацию — большой скачок для реакций.",

      ],

      cons: [

        "**Слабый личный урон** — почти весь вклад через статус, ульту и реакции.",

        "Полная ульта раскрывается с **союзником Нод-Края** (усиление **Восходящее сияние**); без него утка стреляет реже и слабее.",

        "**С6** заметно важнее остальных созвездий — без него ценность в топ-отрядах ниже.",

        "Соло-Гидро требует **200%+ ВЭ** или батарею (Фавоний / сигна).",

      ],

    },

    {

      id: uid(),

      type: "text",

      eyebrow: "Билд",

      title: "Как собирать Айно",

      body: `Сборка под **мастерство стихий**, **восстановление энергии** и комфортную **ульту**. Личный Гидро-урон вторичен — криты не приоритет.



**МС 700+**, **ВЭ 200%+** в соло-Гидро (или **~170%** с резонансом и **Двуручным мечом Фавония**). Пески, кубок и корона — **МС** (корона **МС** или **К/Ш**, если играете с Фавонием). В сабах: **ВЭ% · МС**. Приоритет прокачки: **Q > E > NA**.`,

    },

    {

      id: uid(),

      type: "statTargets",

      eyebrow: "Билд",

      title: "Рекомендуемые значения характеристик",

      intro: "Закройте МС и ВЭ — от них зависят зона ульты, пассивка burst и комфорт ротации.",

      targets: [

        {

          id: uid(),

          label: "МС",

          value: "700+",

          hint: "Урон водяных шаров и пассивка burst (+50% урона Q от МС)",

        },

        {

          id: uid(),

          label: "ВЭ",

          value: "200%+ / ~170%",

          hint: "200%+ соло-Гидро; ~170% с резонансом и Фавонием",

        },

        {

          id: uid(),

          label: "Криты",

          value: "не нужны",

          hint: "Только если берёте Фавоний — немного К/Ш в сабах",

        },

      ],

      slots: [

        { id: uid(), slot: "Пески", main: "МС", subs: "ВЭ% · МС" },

        { id: uid(), slot: "Кубок", main: "МС", subs: "ВЭ% · МС" },

        { id: uid(), slot: "Корона", main: "МС / К/Ш (Фавоний)", subs: "ВЭ% · МС" },

      ],

    },

    {

      id: uid(),

      type: "rankedList",

      eyebrow: "Оружие",

      title: "Рейтинг оружия",

      intro:

        "Ищите **МС**, **ВЭ%** и пассивки под Лунные реакции. Лучший крафт — **Мастер-ключ**; **Фавоний** — если нужна батарея.",

      kind: "weapons",

      items: weaponItems,

    },

    {

      id: uid(),

      type: "rankedList",

      eyebrow: "Артефакты",

      title: "Полезные артефакты",

      intro:

        "Цель почти всегда — **4п Серенада шёлковой луны**. В bloom с **Нилу** — **Цветок потерянного рая**; на старте — **Инструктор** или **2+2 МС**.",

      kind: "artifacts",

      items: artItems,

    },

    {

      id: uid(),

      type: "setPlan",

      eyebrow: "Артефакты",

      title: "Как раздать сеты в отряде Флинса",

      intro: "Ориентир для топ-команды Лунного заряда с Айно вместо Коломбины.",

      groups: [

        {

          id: uid(),

          title: "Лунный заряд · Флинс",

          rows: [

            planRow(c("flins", "флинс"), "Флинс", "Ночь открытия неба", artImg(artNoch, "Ночь открытия неба")),

            planRow(

              c("ineffa", "инеффа"),

              "Инеффа",

              "Рассвет / урон",

              artImg(artRassvet, "Рассветная песнь звезды и луны"),

            ),

            {

              id: uid(),

              name: NAME,

              image: IMAGE,

              href: `/wiki/characters/${SLUG}`,

              setName: "Серенада шёлковой луны",

              setImage: artImg(artSerenada, "Серенада шёлковой луны"),

            },

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

      title: "Отряды под Лунные реакции и Гидро",

      body: `Айно вставляется почти в любой **Лунный заряд / бутонизацию / кристалл**, где нужен **стабильный Гидро** и **слот Нод-Края**. Ядро часто: **мейн-дд реакции + Айно + саппорт Нод-Края + flex**.



Без **Высшего сияния** зона ульты слабее — держите в отряде ещё одного героя **Нод-Края** (Флинс, Инеффа, Нефер, Лаума, Цзы Бай и др.). **С6** заметно усиливает реакционный урон всей команды.`,

    },

    {

      id: uid(),

      type: "roleTable",

      eyebrow: "Отряды",

      title: "Приоритетные персонажи",

      intro: "Лучшие союзники для Айно:",

      rows: [

        roleRow(

          c("flins", "флинс"),

          "Флинс",

          "Копьё",

          "Мейн-дд Лунного заряда; лучший партнёр для Гидро-статуса и знамения.",

        ),

        roleRow(

          c("ineffa", "инеффа"),

          "Инеффа",

          "Копьё",

          "Щит, карманный Электро и ~+40% урона отряда с Флинсом; второй слот Нод-Края.",

        ),

        roleRow(

          c("nefer", "нефер"),

          "Нефер",

          "Катализатор",

          "Мейн-дд Лунной бутонизации; нужны Гидро и знамение — Айно закрывает оба.",

        ),

        roleRow(

          c("lauma", "лаума"),

          "Лаума",

          "Катализатор",

          "Саппорт ЛБ: криты и урон реакции; без неё Нефер теряет ~40% DPS.",

        ),

        roleRow(

          c("czy-baj", "цзы бай"),

          "Цзы Бай",

          "Меч",

          "Мейн-дд Лунного кристалла; Айно даёт Гидро и +1 к знамению.",

        ),

        roleRow(

          c("linneya", "линнея"),

          "Линнея",

          "Лук",

          "Хил и Лунный кристалл; удобна с Цзы Баем и Иллуги.",

        ),

        roleRow(

          c("nilou", "нилу"),

          "Нилу",

          "Меч",

          "Классическая бутонизация; Айно — Гидро + Нод-Край в одном слоте.",

        ),

        roleRow(

          c("arlekino", "арлекино"),

          "Арлекино",

          "Катализатор",

          "Пиро-мейн; Инеффа + Айно дают щит, статус и реакции.",

        ),

        roleRow(

          c("sucrose", "сахароза"),

          "Сахароза",

          "Катализатор",

          "МС, стяжка и срез резистов — стандартный flex в ЛЗ-командах.",

        ),

        roleRow(

          c("yagoda", "ягода"),

          "Ягода",

          "Лук",

          "Хил и слот Нод-Края, если Гидро уже закрыт.",

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

          "Топ Лунный заряд: Флинс + Инеффа + Анемо-саппорт.",

          [

            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),

            member(c("ineffa", "инеффа"), "Инеффа", "Щит / саб"),

            member(c("sucrose", "сахароза"), "Сахароза", "Анемо / МС"),

            self("Гидро / знамение"),

          ],

          "Топ",

        ),

        variant(

          "Альтернатива: Флинс + Айно + Электро-саб + Анемо/хил.",

          [

            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),

            self("Гидро / знамение"),

            member(c("iansan", "иансан") || c("fischl", "фишль"), "Иансан / Фишль", "Электро"),

            member(

              c("lan-yan", "lan_yan", "lan yan", "лан ян") ||

                c("jean", "джинн") ||

                c("sucrose", "сахароза"),

              "Лан Ян / Джинн / Сахароза",

              "Анемо / хил",

            ),

          ],

          "Альтернатива",

        ),

        variant(

          "Бюджет ЛЗ: Флинс + Айно + Барбара + Линетт.",

          [

            member(c("flins", "флинс"), "Флинс", "Мейн-дд"),

            self("Гидро / знамение"),

            member(c("barbara", "барбара"), "Барбара", "Хил / Гидро"),

            member(c("linett", "линетт"), "Линетт", "Анемо"),

          ],

          "Бюджет",

        ),

        variant(

          "Лунная бутонизация: Нефер + Лаума + Нахида.",

          [

            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),

            member(c("lauma", "лаума"), "Лаума", "Саппорт ЛБ"),

            self("Гидро / знамение"),

            member(c("nahida", "нахида"), "Нахида", "Дендро / резонанс"),

          ],

          "Топ",

        ),

        variant(

          "Нефер без Лаумы: Нахида + flex МС/хил.",

          [

            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),

            member(c("nahida", "нахида"), "Нахида", "Дендро"),

            self("Гидро / знамение"),

            member(

              c("diona", "диона") || c("sucrose", "сахароза") || c("albedo", "альбедо"),

              "Диона / Сахароза / Альбедо",

              "Flex",

            ),

          ],

          "Альтернатива",

        ),

        variant(

          "Бюджет Нефер: Коллеи + Барбара или Яо Яо.",

          [

            member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),

            member(c("collei", "коллеи"), "Коллеи", "Дендро"),

            self("Гидро / знамение"),

            member(c("barbara", "барбара") || c("yao-yao", "яо яо"), "Барбара / Яо Яо", "Хил"),

          ],

          "Бюджет",

        ),

        variant(

          "Лунный кристалл: Цзы Бай + Иллуги + Линнея.",

          [

            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),

            self("Гидро / знамение"),

            member(c("illugi", "иллуги"), "Иллуги", "Саб / Гео"),

            member(c("linneya", "линнея"), "Линнея", "Хил"),

          ],

          "Топ",

        ),

        variant(

          "Цзы Бай + Иллуги + Горо (без Линнеи).",

          [

            member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),

            self("Гидро / знамение"),

            member(c("illugi", "иллуги"), "Иллуги", "Саб"),

            member(c("gorou", "горо"), "Горо", "Бафф Гео"),

          ],

          "Альтернатива",

        ),

        variant(

          "Пиро: Арлекино + Инеффа + Бенnett.",

          [

            member(c("arlekino", "арлекино"), "Арлекино", "Мейн-дд"),

            member(c("ineffa", "инеффа"), "Инеффа", "Щит / саб"),

            self("Гидро / знамение"),

            member(c("bennett", "бенnett", "bennett"), "Бенnett", "Бафф / Пиро"),

          ],

          "Топ",

        ),

        variant(

          "Электро/Гидро мейн + Инеффа: Клоринда / Райдэн / Аято.",

          [

            member(

              c("klorinda", "клоринда") || c("shougun", "райдэн") || c("ayato", "аято"),

              "Клоринда / Райдэн / Аято",

              "Мейн-дд",

            ),

            member(c("ineffa", "инеффа"), "Инеффа", "Щит / саб"),

            self("Гидро / знамение"),

            member(c("sucrose", "сахароза"), "Сахароза", "Анемо / МС"),

          ],

          "Альтернатива",

        ),

        variant(

          "Классический bloom: Нилу + Нахида + хил/щит.",

          [

            member(c("nilou", "нилу"), "Нилу", "Мейн-дд bloom"),

            member(c("nahida", "нахида"), "Нахида", "Дендро"),

            self("Гидро / знамение"),

            member(

              c("bay-chzhu", "бай чжу") || c("yao-yao", "яо яо") || c("kirara", "кирара"),

              "Бай Чжу / Яо Яо / Кирара",

              "Хил / щит",

            ),

          ],

          "Топ",

        ),

      ],

    },

    {

      id: uid(),

      type: "resourceTable",

      title: "Возвышение",

      intro: "Ресурсы для возвышения Айно (лазурит Варунада + материалы Нод-Края):",

      rows: [

        {

          id: uid(),

          name: matLaz1?.name || "Лазурит Варунада",

          image: matLaz1?.image || "",

          qty: "1→9→9→6",

          where: "Еженедельные и мировые боссы (серия лазурита Варунада)",

          href: matLaz1 ? `/wiki/materials/${matLaz1.slug}` : undefined,

        },

        {

          id: uid(),

          name: (() => {

            if (!matShaft1) noteMissing("material", "Сломанный вал");

            if (!matShaft2) noteMissing("material", "Усиленный вал");

            return matShaft3?.name || "Валы";

          })(),

          image: matShaft3?.image || "",

          qty: "18 / 30 / 36",

          where: "Опричники Фатуи (Сломанный / Усиленный / Высокоточный вал)",

          href: matShaft3 ? `/wiki/materials/${matShaft3.slug}` : undefined,

        },

        {

          id: uid(),

          name: matBoss?.name || "Штамповочная форма куувяки",

          image: matBoss?.image || "",

          qty: "46",

          where: "Мировой босс (Штамповочная форма куувяки)",

          href: matBoss ? `/wiki/materials/${matBoss.slug}` : undefined,

        },

        {

          id: uid(),

          name: matBearing?.name || "Переносной подшипник",

          image: matBearing?.image || "",

          qty: "168",

          where: "Диковинка (Переносной подшипник)",

          href: matBearing ? `/wiki/materials/${matBearing.slug}` : undefined,

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

          name: matSilk?.name || "Шёлковое перо",

          image: matSilk?.image || "",

          rarity: 5 as const,

          note: "×4",

          qty: "4",

          href: matSilk ? `/wiki/materials/${matSilk.slug}` : undefined,

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

        "Растёт **МС** (**+96** на 90 ур.). Качайте **Q** и **E** — от МС зависят зона ульты и пассивка burst.",

      colLabels: [

        "Уровень",

        "Базовое HP",

        "Базовая сила атаки",

        "Базовая защита",

        "Базовый К/Ш",

        "Бонус МС (возвышение)",

      ],

      rows: [

        emptyStatsRow("1", "939", "20", "51", "5%", "0"),

        emptyStatsRow("20", "2 413", "52", "131", "5%", "0"),

        emptyStatsRow("40", "4 665", "101", "253", "5%", "0"),

        emptyStatsRow("50", "5 939", "128", "322", "5%", "24"),

        emptyStatsRow("60", "7 379", "160", "400", "5%", "48"),

        emptyStatsRow("70", "8 653", "187", "469", "5%", "48"),

        emptyStatsRow("80", "9 927", "215", "538", "5%", "72"),

        emptyStatsRow("90", "11 201", "242", "607", "5%", "96"),

      ],

    },

    {

      id: uid(),

      type: "text",

      eyebrow: "Геймплей",

      title: "Способности",

      body: `Айно — **Гидро саппорт** с механикой **«Остынь, утка!»** и зоной **Сфокусированного гидроохлаждения**. Личный урон низкий; ценность — статус, карманная ульта и **Лунное знамение**.



### Приоритет прокачки

**Q > E > NA** (обычные почти не нужны).



### Активные навыки

- **Починка методом бах-бум-бац** — до 3 ударов двуручником; заряженная — вращение с финальным ударом; падение — Гидро по области.

- **Ловец вдохновения (Е)** — бросает **Ловец вдохновения**, тянет Айно за собой и наносит **Гидро** по площади на 2-й стадии. Удержание — прицеливание. Откат **10** сек.

- **Точный водоохладитель (Q)** — ставит **«Остынь, утка!»** и зону **Сфокусированного гидроохлаждения**: периодически стреляет водяными шарами (**Гидро**). **50** энергии, откат **13.5** сек., длительность **14** сек.



### Пассивки

- **Протокол модульной эффективности** — при **Знамении: Восходящее сияние** ульта усилена: утка стреляет чаще, шары бьют по большей площади.

- **Структурированный усилитель** — урон **Q** +**50%** от МС Айно.

- **Дар лунного знамения: Анализ предела мощности** — пока Айно в отряде, уровень **Лунного знамения** +**1**.

- **Миниатюрный сенсор распознавания** — на мини-карте отмечает **диковинки Нод-Края**; можно менять внешний вид утки.`,

    },

    {

      id: uid(),

      type: "text",

      eyebrow: "Геймплей",

      title: "Как играть и стоит ли качать",

      body: `### Ротация

1. Саппорты накладывают баффы и **элементальные статусы**.

2. **Е** Айно — Гидро и позиционирование.

3. **Q** — зона охлаждения и постоянный водяной статус.

4. Мейн-дд выходит на поле и качает урон реакций.

5. Обновляйте **Q** и **Е** по откату.



> Порядок: **баффы → Е → Q → мейн-дд**.



### Стоит ли качать?

**A-tier** саппорт для **Нод-Края**: бесплатный **Гидро + знамение**, сильна в **Флинсе**, **Нефер**, **Цзы Бае**, **Нилu** и др. Личный урон слабый; полная ульта хочет **союзника Нод-Края** для **Восходящего сияния**. **С6** — главный скачок для реакционного урона.



### Созвездия

- **С1** — +**80** МС себе и отряду после **Е/Q** (15 сек.).

- **С2** — доп. водяной шар из кармана (25% АТК + 100% МС), раз в **5** сек.

- **С6** — +**15%** урона Заряжен / Бутонизация / ЛЗ / ЛБ; при **Восходящем сиянии** ещё **+20%**.`,

    },

    {

      id: uid(),

      type: "text",

      eyebrow: "Лор",

      title: "Биография",

      body: `Айно — гениальный механик и изобретатель из **Нод-Края**, работает в кондитерской-мастерской **«Дзынь-Клац»**. Обожает необычные машины и сладости; её верный спутник — самодельная утка **«Остынь, утка!»**.



Созвездие **Грохочущий Ларец**, особое блюдо **Кондитерский стаканчик Дзынь-Клац** и именная карточка **Айно: Утиная оплошность** подчёркивают образ юной изобретательницы, которая чинит механизмы «методом бах-бум-бац».`,

    },

  ];



  if (!matBook1) noteMissing("material", "Учения о «Рае»");

  if (!matBook2) noteMissing("material", "Указания о «Рае»");

  if (!matBook3) noteMissing("material", "Философия о «Рае»");

  if (!matSilk) noteMissing("material", "Шелковистое перо");



  const levelMaterials: CharacterMaterial[] = [

    matCard(matBearing, "Переносной подшипник", 168, "local", 1),

    matCard(matBoss, "Штамповочная форма куувяки", 46, "boss", 4),

    matCard(matLaz1, "Осколок лазурита Варунада", 1, "ascension", 2),

    matCard(matLaz2, "Фрагмент лазурита Варунада", 9, "ascension", 3),

    matCard(matLaz3, "Кусок лазурита Варунада", 9, "ascension", 4),

    matCard(matLaz4, "Драгоценный лазурит Варунада", 6, "ascension", 5),

    matCard(matShaft1, "Сломанный вал", 18, "ascension", 1),

    matCard(matShaft2, "Усиленный вал", 30, "ascension", 2),

    matCard(matShaft3, "Высокоточный вал", 36, "ascension", 3),

    matCard(matBook1, "Учения о «Рае»", 9, "talent", 2),

    matCard(matBook2, "Указания о «Рае»", 63, "talent", 3),

    matCard(matBook3, "Философия о «Рае»", 114, "talent", 4),

    matCard(matSilk, "Шелковистое перо", 12, "talent", 5),

    matCard(matCrown, "Корона прозрения", 3, "talent", 5),

    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),

    matCard(m("Мора"), "Мора", 1653000, "exp", 3),

  ];



  const contentHtml = serializeGuide(blocks);

  const shortDesc =

    "Айно — Гидро саппорт Лунных реакций: билд, оружие, сеты и отряды.";



  const iconBase = "/images/talents/ajno";

  const cIconBase = "/images/constellations/ajno";

  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  const tv = loadTalentValues();



  const talents = [

    {

      id: "t_na",

      name: "Починка методом бах-бум-бац",

      icon: `${iconBase}/na.png`,

      description:

        "**Обычная атака:** до трёх последовательных ударов двуручником, наносящих **Гидро урон**.\n\n**Заряженная:** тратит выносливость и выполняет непрерывные вращательные удары; в конце — более сильный финальный удар.\n\n**Удар в падении:** стремительное падение, затем **Гидро урон** по области при приземлении.",

      loreText: "Любая поломка лечится бах-бум-бац.",

      levelLabels: lv13,

      stats: [

        { label: "Урон 1 удара", values: tv.na[0] },

        { label: "Урон 2 удара", values: tv.na[1] },

        { label: "Урон 3 удара", values: tv.na[2] },

        { label: "Урон вращения заряженной", values: tv.na[3] },

        { label: "Урон финального удара заряженной", values: tv.na[4] },

        { label: "Расход выносливости заряженной", values: tv.na[5] },

        { label: "Макс. длительность", values: tv.na[6] },

        { label: "Урон в падении", values: tv.na[7] },

        { label: "Низкий / высокий удар", values: tv.na[8] },

      ],

      order: 0,

    },

    {

      id: "t_skill",

      name: "Ловец вдохновения",

      icon: `${iconBase}/skill.png`,

      description:

        "Айно бросает **Ловец вдохновения** вперёд, нанося **Гидро урон** и утягивая себя за устройством. По остановке — **Гидро урон** по площади рядом.\n\n**Удержание:** режим прицеливания для направления броска.",

      loreText: "Вдохновение можно поймать — если метко бросить.",

      levelLabels: lv13,

      stats: [

        { label: "Урон 1 стадии", values: tv.sk[0] },

        { label: "Урон 2 стадии", values: tv.sk[1] },

        { label: "Время отката", values: tv.sk[2] },

      ],

      order: 1,

    },

    {

      id: "t_burst",

      name: "Точный водоохладитель",

      icon: `${iconBase}/burst.png`,

      description:

        "Айно разворачивает самодельный водяной распылитель **«Остынь, утка!»** и создаёт **Сфокусированную зону гидроохлаждения**.\n\nПока зона активна, утка периодически стреляет водяными шарами по противникам рядом, нанося **Гидро урон**. При **Знамении: Восходящее сияние** стрельба чаще, шары бьют по большей площади.",

      loreText: "Точность охлаждения — залог исправной механики.",

      levelLabels: lv13,

      stats: [

        { label: "Урон водяного снаряда", values: tv.bu[0] },

        { label: "Длительность", values: tv.bu[1] },

        { label: "Время отката", values: tv.bu[2] },

        { label: "Потребление энергии", values: tv.bu[3] },

      ],

      order: 2,

    },

    {

      id: "t_p1",

      name: "Протокол модульной эффективности",

      icon: `${iconBase}/passive1.png`,

      description:

        "В зависимости от **Лунного знамения** отряда Айно получает соответствующий эффект.\n\n**Знамение: Восходящее сияние:** **Точный водоохладитель** усилен — **«Остынь, утка!»** стреляет чаще, водяные шары наносят **Гидро урон** по большей площади.",

      order: 3,

    },

    {

      id: "t_p2",

      name: "Структурированный усилитель",

      icon: `${iconBase}/passive2.png`,

      description:

        "Урон **Точного водоохладителя** увеличивается на **50%** от мастерства стихий Айно.",

      order: 4,

    },

    {

      id: "t_p3",

      name: "Дар лунного знамения: Анализ предела мощности",

      icon: `${iconBase}/passive3.png`,

      description:

        "Пока Айно в отряде, уровень **Лунного знамения** отряда увеличивается на **1**.",

      order: 5,

    },

    {

      id: uid(),

      id: "t_util",

      name: "Миниатюрный сенсор распознавания",

      icon: `${iconBase}/utility.png`,

      description:

        "На мини-карте отображаются **диковинки, уникальные для Нод-Края**.\n\nКроме того, Айно может менять внешний вид **«Остынь, утка!»**.",

      order: 6,

    },

  ];



  const constellations = [

    {

      id: "c1",

      level: 1,

      name: "Параллельная теория пыли и силовых полей",

      icon: `${cIconBase}/c1.png`,

      description:

        "После **Ловца вдохновения** или **Точного водоохладителя** МС Айно +**80**. МС других активных персонажей рядом +**80** на **15** сек.\n\nЭффекты не складываются.",

      order: 0,

    },

    {

      id: "c2",

      level: 2,

      name: "Принцип передачи в зубчатых дифференциалах",

      icon: `${cIconBase}/c2.png`,

      description:

        "Если Айно вне поля, пока активна **Сфокусированная зона гидроохлаждения**, при попадании активного персонажа по противнику **«Остынь, утка!»** выпускает доп. водяной шар: **Гидро урон** по площади = **25%** АТК + **100%** МС Айно (считается уроном **Q**). Раз в **5** сек.",

      order: 1,

    },

    {

      id: "c3",

      level: 3,

      name: "Торт и искусство ремонта механизмов",

      icon: `${cIconBase}/c3.png`,

      description:

        "Уровень **Точного водоохладителя** +**3** (макс. **15**).",

      order: 2,

    },

    {

      id: "c4",

      level: 4,

      name: "Масло, кошки и закон энергоснабжения",

      icon: `${cIconBase}/c4.png`,

      description:

        "Когда **Ловец вдохновения** попадает по противнику, Айно восстанавливает **10** ед. энергии. Не чаще раза в **10** сек.",

      order: 3,

    },

    {

      id: "c5",

      level: 5,

      name: "Вечная турбина из металла и света",

      icon: `${cIconBase}/c5.png`,

      description:

        "Уровень **Ловца вдохновения** +**3** (макс. **15**).",

      order: 4,

    },

    {

      id: "c6",

      level: 6,

      name: "Бремя творческого гения",

      icon: `${cIconBase}/c6.png`,

      description:

        "В течение **15** сек. после **Точного водоохладителя** урон **Заряжен**, **Бутонизация**, **Лунный заряд** и **Лунная бутонизация** активных персонажей рядом +**15%**.\n\n**Знамение: Восходящее сияние:** указанные реакции получают ещё **+20%** урона.",

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

        rarity: Rarity.EPIC,

        element: Element.HYDRO,

        weaponType: "Двуручник",

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

        rarity: Rarity.EPIC,

        element: Element.HYDRO,

        weaponType: "Двуручник",

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


