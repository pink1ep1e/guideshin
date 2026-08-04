/**
 * Импорт гайда на Нефер.
 * Источники: wotpack.ru (билды/отряды), wiki.hoyolab.com/pc/genshin/entry/8894 + Honey Hunter (статы/таланты).
 *
 *   npx tsx scripts/seed-nefer-guide.ts
 *
 * Важно: НЕ трогаем image / splashImage — у Нефер уже корректные иконки в БД.
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

const SLUG = "nefer";
const NAME = "Нефер";
/** Только для отображения в блоках гайда (self / setPlan) — не пишем в upsert. */
const IMAGE = "/uploads/icons/1785446044646-c2cd79ed.png";
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

/** L1–13 из Honey Hunter; компактный формат «АТК + МС». */
function ae(atk: string, em: string): string {
  return `${atk}% АТК + ${em}% МС`;
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

  const artNoch = a("Ночь открытия неба");
  const artSerenada = a("Серенада шёлковой луны", "Серенада шелковой луны");
  const artRassvet = a("Рассветная песнь звезды и луны");
  const artLes = a("Воспоминания дремучего леса");

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
      w("Шкатулка истин"),
      1,
      "Шкатулка истин",
      "Сигна",
      "К/Ш, МС после Е и К/У Лунной бутонизации; оба эффекта усиливаются вместе.",
      "Лучший выбор: криты + МС под Игру химер (урон тени = ЛБ).",
      "S",
    ),
    rankedWeapon(
      w("Зеркало прядильщицы ночи"),
      2,
      "Зеркало прядильщицы ночи",
      "МС · ЛБ отряду",
      "МС носителю и сильный бафф Бутонизации / ЛБ отряду.",
      "Только если Лаума не занимает катализатор. Иначе отдайте жрице.",
      "A",
    ),
    rankedWeapon(
      w("Вызов ноктюрна"),
      3,
      "Вызов ноктюрна",
      "К/У Лунных реакций",
      "К/У нод-краевских реакций и энергия; HP ей почти не нужен.",
      "Сильная альтернатива сигне по К/У реакций.",
      "A",
    ),
    rankedWeapon(
      w("Рассветный иней"),
      4,
      "Рассветный иней",
      "Лучший 4★",
      "К/У + МС после заряженной и Е.",
      "Лучший эпик; желательно Р3–Р5. В артефактах добивайте К/Ш.",
      "A",
    ),
    rankedWeapon(
      w("Обряд вечного течения"),
      5,
      "Обряд вечного течения",
      "С Фуриной",
      "К/У и усиление заряженных при колебаниях HP.",
      "Имеет смысл в отряде с Фуриной (хилер обязателен).",
      "B",
    ),
    rankedWeapon(
      w("Бдение взывающего к звёздам", "Бдение взывающего к звездам"),
      6,
      "Бдение взывающего к звёздам",
      "МС",
      "Огромный МС; пассивка щита почти не реализуется.",
      "Удобно балансировать криты, если уже есть.",
      "B",
    ),
    rankedWeapon(
      w("Фонарь чёрной сердцевины", "Фонарь черной сердцевины"),
      7,
      "Фонарь чёрной сердцевины",
      "Крафт F2P",
      "Прямой бонус Бутонизации / ЛБ (+ещё при Высшем сиянии).",
      "Оптимальный бесплатный катализатор Нод-Края.",
      "B",
    ),
    rankedWeapon(
      w("Сновидения тысячи ночей"),
      8,
      "Сновидения тысячи ночей",
      "МС отряду",
      "МС и бонус стихии по составу; бафф МС союзникам.",
      "Универсально, но криты нужно собирать вручную.",
      "C",
    ),
    rankedWeapon(
      w("Морской атлас"),
      9,
      "Морской атлас",
      "Временный F2P",
      "МС и бонус элементального урона после реакций.",
      "Только до крафта Фонаря; не пробуждайте.",
      "C",
    ),
  ];

  const artEmPiece =
    a("Странствующий ансамбль") ||
    a("Позолоченные сны") ||
    a("Цветок потерянного рая") ||
    artNoch;
  if (!artEmPiece) noteMissing("artifact", "2+2 МС сеты");

  const artItems: GuideRankedItem[] = [
    rankedArt(
      artNoch,
      1,
      "Ночь открытия неба",
      "Лучший 4п",
      "МС + К/Ш при Лунных реакциях и Высшем сиянии; бафф Лунных реакций отряду.",
      "Основной сет: с союзником Нод-Края даёт ~30% К/Ш.",
      "S",
    ),
    {
      id: uid(),
      rank: 2,
      name: "2+2 МС (Странствующий / Позолоченные / Цветок / Ночь)",
      image: artEmPiece?.image || STUB_IMAGE,
      rarity: 5 as const,
      href: artEmPiece ? `/wiki/artifacts/${artEmPiece.slug}` : undefined,
      subtitle: "2+2 МС",
      effect: "Каждые 2 части: +80 МС.",
      verdict: "Если криты уже сбалансированы — берите лучшие куски без потери 2+2.",
      tier: "A",
    },
    rankedArt(
      a("Охотник Сумеречного двора"),
      3,
      "Охотник Сумеречного двора",
      "С Фуриной",
      "Урон обычных/заряженных + стаки К/Ш при колебаниях HP.",
      "Временно с Фуриной и хилером; в других группах не фармить.",
      "B",
    ),
    rankedArt(
      a("Позолоченные сны"),
      4,
      "Позолоченные сны",
      "Двойной резонанс",
      "МС + АТК/МС по составу элементов после реакции.",
      "Выгодно при 2 Дендро + 2 Гидро; при 3 Дендро слабее солянки.",
      "B",
    ),
    rankedArt(
      a("Цветок потерянного рая"),
      5,
      "Цветок потерянного рая",
      "Без Лаумы / Нахиды",
      "Усиление Бутонизации / ЛБ стаками после реакций.",
      "Мало полезных статов — добирать криты отдельно. Без Лаумы/Нахиды ок.",
      "B",
    ),
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "Кто такая Нефер",
      body: `Нефер — **Дендро-катализатор 5★**, глава **Куратория тайн** в Нод-Крае. Мейн-дд через **Лунную бутонизацию**: основной урон — заряженные **Игра химер** в стойке **Танца тени** (Е). Нужен союзник Нод-Края для **Высшего сияния**; лучший саппорт — **Лаума** (~**40%** личного урона без неё).

Источники: [гайд wotpack](https://wotpack.ru/nefer-v-genshin-impact-kogda-vyydet-stihiya-i-oruzhie/), [HoYoWiki](https://wiki.hoyolab.com/pc/genshin/entry/8894), [Honey Hunter](https://gensh.honeyhunterworld.com/nefer_122/).

### Кратко
- **Рейтинг** — S+
- **Титул** — Тайна под песками · глава Куратория тайн
- **Стихия / оружие** — Дендро · катализатор
- **Возвышение** — крит. урон (+**38.4%** к 90 ур., итого **~88.4%** К/У с базой 50%)
- **База на 90 ур.** — HP **12 704** · АТК **344** · Защита **799** · К/Ш 5% · К/У 50%+38.4%
- **В игре с** — 22 октября 2025 (патч 6.1); баннер «Искушение красных песков» (реран 6.5)
- **День рождения** — 9 мая
- **Получение** — молитва события; сигна — **Шкатулка истин**
- **Регион / фракция** — Нод-Край · Кураторий тайн
- **Созвездие** — Игровая Доска (EN *Ludus Latrunculorum*)
- **Особое блюдо** — **Тайны в обмен**
- **Озвучка** — EN Ashleigh Haddad · JP Mizuki Nana · CN Zeng Tong · KR Won Esther`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Преимущества и недостатки",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Единственный полноценный мейн-дд Лунной бутонизации: стабильный АоЕ даже на С0 и бафф ЛБ от собственного МС.",
        "Сборка относительно простая: упор на МС и криты; кубок на МС заметно сильнее Дендро.",
        "Высокий потолок в эндгейме при готовом отряде с Лаумой и союзником Нод-Края.",
      ],
      cons: [
        "Жёстко завязана на Бутонизацию / ЛБ: Семена лжи не работают в Вегетации и Цветении.",
        "Ограниченный пул союзников: нужны Гидро-аппликатор, Дендро и герой Нод-Края. Без Лаумы личный урон падает примерно на 40%.",
        "Малый выбор оружия: среди 4★ реально сильны крафтовый Фонарь и Рассветный иней; остальное — компромисс.",
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Билд",
      title: "Как собирать Нефер",
      body: `Оптимальная сборка целиком под **личный урон**. Скейлы Е и Q — от **АТК и МС**, но из‑за Лунной бутонизации приоритет у **мастерства стихий**. Криты влияют и на личный дамаг, и на цифры реакции.

**ВЭ** при втором Дендро можно почти не набирать (ульта дешёвая, но полезный сайд-дамаг). В кубке берите **МС**, не Дендро — разница больше **30%**.`,
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые значения характеристик",
      intro:
        "Приоритет: МС → криты → (опционально) ВЭ. Кубок на МС сильно лучше Дендро.",
      targets: [
        {
          id: uid(),
          label: "МС",
          value: "800–1000",
          hint: "Для пассивок и потолка бонуса ЛБ (~14% при 800 МС)",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "≤120% или 0",
          hint: "С вторым Дендро можно не набирать вовсе",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "~60% / 70–80% / ~50%",
          hint: "С Ночью + Лаумой ~60%; другой сет — 70–80%; с Нахидой С2 можно ~50%",
        },
        {
          id: uid(),
          label: "К/У",
          value: "200%+",
          hint: "Чем выше — тем сильнее личный урон и ЛБ",
        },
      ],
      slots: [
        { id: uid(), slot: "Пески", main: "МС", subs: "АТК% · К/У · К/Ш · ВЭ%" },
        { id: uid(), slot: "Кубок", main: "МС (не Дендро!)", subs: "АТК% · К/У · К/Ш · ВЭ%" },
        { id: uid(), slot: "Корона", main: "К/У или К/Ш", subs: "МС · АТК% · К/У или К/Ш · ВЭ%" },
        {
          id: uid(),
          slot: "Цветок / Перо",
          main: "HP / АТК",
          subs: "МС · АТК% · К/У · К/Ш",
        },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Ищите криты и МС. Бонусы чистого элементального урона почти бесполезны — важен урон Лунной бутонизации.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Полезные артефакты",
      intro:
        "Лучше всего сеты, дающие К/Ш и усиление Лунных реакций. 2+2 МС — запасной вариант при удачных сабах.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "setPlan",
      eyebrow: "Артефакты",
      title: "Как раздать сеты в топ-отряде Лунной бутонизации",
      intro: "Ориентир по распределению сетов между союзниками.",
      groups: [
        {
          id: uid(),
          title: "Лунная бутонизация",
          rows: [
            {
              id: uid(),
              name: NAME,
              image: IMAGE,
              href: `/wiki/characters/${SLUG}`,
              setName: "Ночь открытия неба",
              setImage: artImg(artNoch, "Ночь открытия неба"),
            },
            planRow(c("lauma", "лаума"), "Лаума", "Серенада", artImg(artSerenada, "Серенада шёлковой луны")),
            planRow(
              c("kolombina", "коломбина"),
              "Коломбина",
              "Рассвет",
              artImg(artRassvet, "Рассветная песнь звезды и луны"),
            ),
            planRow(
              c("nahida", "нахида"),
              "Гидро / Дендро саппорт",
              "Воспоминания дремучего леса",
              artImg(artLes, "Воспоминания дремучего леса"),
            ),
          ],
        },
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Отряды",
      title: "Отряды под Лунную бутонизацию",
      body: `Команды строятся так: **Нефер + Дендро-резонанс + стабильный Гидро-аппликатор + саппорт/саб-дд**. Критичен водяной статус — без него Семена лжи не копятся.

Нужен минимум один герой **Нод-Края** для **Высшего сияния**. Если нет Лаумы и Нахиды, на флекс можно поставить баффера МС (Сахароза, Диона С6, Альбедо) хоть и «не в элементе».`,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Отряды",
      title: "Приоритетные персонажи",
      intro: "Лучшие союзники для Нефер:",
      rows: [
        roleRow(
          c("lauma", "лаума"),
          "Лаума",
          "Катализатор",
          "Лучший саппорт: криты и урон ЛБ, Знамение. Жмите обычное Е, не hold — не отнимайте Росу. Без неё ~−40% личного DPS.",
        ),
        roleRow(
          c("nahida", "нахида"),
          "Нахида",
          "Катализатор",
          "Резонанс, карманный дамаг и МС активному. С2 даёт криты ЛБ — можно снизить требования к К/Ш.",
        ),
        roleRow(
          c("bay-chzhu", "бай чжу"),
          "Бай Чжу",
          "Катализатор",
          "Хил + статус; бафф ЛБ от HP. Особенно силён на С2.",
        ),
        roleRow(
          c("furina", "фурина"),
          "Фурина",
          "Меч",
          "Гидро-апп, если Айно занята. Ульту и ВЭ часто игнорируют; акцент на критах и HP. Нужен хилер.",
        ),
        roleRow(
          c("ajno", "айно"),
          "Айно",
          "Двуручный меч",
          "Бесплатный Гидро + Знамение. Удобнее большинства аппликаторов; С6 сильно баффает.",
        ),
        roleRow(
          c("yagoda", "ягода"),
          "Ягода",
          "Лук",
          "Хил + слот Нод-Края. Уместна без Лаумы или с Фуриной; С6 даёт сильные баффы.",
        ),
        roleRow(
          c("kolombina", "коломбина"),
          "Коломбина",
          "Катализатор",
          "Статус, бафф и Роса. Даёт ~+20% — слабее Лаумы, но заменяется Айно хуже, чем Лаума Нахидой.",
        ),
      ],
    },
    {
      id: uid(),
      type: "teamGroup",
      eyebrow: "Отряды",
      title: "Примеры сильных команд",
      intro: "Варианты с wotpack (топ → бюджет / F2P):",
      variants: [
        variant(
          "Топ-1: Коломбина или Айно (С6). Без С1 Лаумы на Коломбину — Прототип: Янтарь для подхила.",
          [
            self("Мейн-дд"),
            member(c("lauma", "лаума"), "Лаума", "Саппорт"),
            member(c("kolombina", "коломбина"), "Коломбина / Айно", "Гидро"),
            member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
          ],
          "Топ",
        ),
        variant(
          "Комфорт: Бай Чжу / Яо Яо вместо Нахиды — меньше урона, больше выживаемости. Бай Чжу ещё баффает ЛБ от HP.",
          [
            self("Мейн-дд"),
            member(c("lauma", "лаума"), "Лаума", "Саппорт"),
            member(c("kolombina", "коломбина"), "Коломбина / Айно", "Гидро"),
            member(c("bay-chzhu", "бай чжу"), "Бай Чжу", "Хил"),
          ],
          "Топ",
        ),
        variant(
          "С Ягодой С6: Лауме — Воспоминания леса, Ягоде — Серенада. Анемо закрывает хил и Знамение.",
          [
            self("Мейн-дд"),
            member(c("lauma", "лаума"), "Лаума", "Саппорт"),
            member(c("ajno", "айно"), "Айно / Коломбина / Фурина", "Гидро"),
            member(c("yagoda", "ягода"), "Ягода", "Хил"),
          ],
          "Альтернатива",
        ),
        variant(
          "Без Коломбины/Айно: Фурина, Е Лань или Син Цю + Нахида. Бафф Гидро на ЛБ не работает.",
          [
            self("Мейн-дд"),
            member(c("lauma", "лаума"), "Лаума", "Саппорт"),
            member(c("furina", "фурина"), "Фурина", "Гидро"),
            member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
          ],
          "Альтернатива",
        ),
        variant(
          "Бюджет без Лаумы: Айно даёт Знамение и Гидро; Нахида/Коллеи + Кирара/Кокоми на выживаемость.",
          [
            self("Мейн-дд"),
            member(c("nahida", "нахида"), "Нахида / Коллеи", "Саб-дд"),
            member(c("ajno", "айно"), "Айно", "Гидро"),
            member(c("kirara", "кирара"), "Кирара / Кокоми", "Щит/хил"),
          ],
          "Бюджет",
        ),
        variant(
          "F2P: Дендро ГГ + Айно + Коллеи / Яо Яо / Барбара. В БД может не быть Дендро Путешественника — заглушка.",
          [
            self("Мейн-дд"),
            member(
              c("puteshestvennik-dendro", "путешественник дендро", "dendro-traveler"),
              "Дендро Путешественник",
              "Саб-дд",
            ),
            member(c("ajno", "айно"), "Айно", "Гидро"),
            member(c("collei", "коллеи"), "Коллеи / Яо Яо / Барбара", "Флекс"),
          ],
          "F2P",
        ),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Все ресурсы для возвышения Нефер (wotpack):",
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
            const frost = m("Заиндевевший мандат");
            const worn = m("Потрепанный мандат");
            const fine = m("Безупречный мандат");
            if (!worn) noteMissing("material", "Потрепанный мандат");
            if (!fine) noteMissing("material", "Безупречный мандат");
            return frost?.name || "Мандаты опричников";
          })(),
          image: m("Заиндевевший мандат")?.image || "",
          qty: "18 / 30 / 36",
          where: "Опричники Фатуи (Потрепанный / Безупречный / Заиндевевший мандат)",
          href: m("Заиндевевший мандат")
            ? `/wiki/materials/${m("Заиндевевший мандат")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Сияющие рога")?.name || "Сияющие рога",
          image: m("Сияющие рога")?.image || "",
          qty: "46",
          where: "Мировой босс «Повелитель морозной ночи»",
          href: m("Сияющие рога")
            ? `/wiki/materials/${m("Сияющие рога")!.slug}`
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
          name: m("Учения о «Рае»")?.name || "Учения о «Рае»",
          image: m("Учения о «Рае»")?.image || "",
          rarity: 4 as const,
          note: "×3",
          qty: "3",
          href: m("Учения о «Рае»")
            ? `/wiki/materials/${m("Учения о «Рае»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Указания о «Рае»")?.name || "Указания о «Рае»",
          image: m("Указания о «Рае»")?.image || "",
          rarity: 4 as const,
          note: "×21",
          qty: "21",
          href: m("Указания о «Рае»")
            ? `/wiki/materials/${m("Указания о «Рае»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Философия о «Рае»")?.name || "Философия о «Рае»",
          image: m("Философия о «Рае»")?.image || "",
          rarity: 4 as const,
          note: "×38",
          qty: "38",
          href: m("Философия о «Рае»")
            ? `/wiki/materials/${m("Философия о «Рае»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Вознёсшийся образец: Ладья")?.name || "Вознёсшийся образец: Ладья",
          image: m("Вознёсшийся образец: Ладья")?.image || "",
          rarity: 5 as const,
          note: "×6",
          qty: "6",
          href: m("Вознёсшийся образец: Ладья")
            ? `/wiki/materials/${m("Вознёсшийся образец: Ладья")!.slug}`
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
        "Растёт **крит. урон** (+38.4% к базе на 90 ур.). Итого без экипировки **~88.4% К/У**. Качайте до 90; 95/100 желательны, но не критичны. Источник: Honey Hunter / HoYoWiki.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый К/У",
        "Бонус К/У (возвышение)",
      ],
      rows: [
        emptyStatsRow("1", "989", "27", "62", "50%", "0%"),
        emptyStatsRow("20", "2 565", "70", "161", "50%", "0%"),
        emptyStatsRow("40", "5 107", "138", "321", "50%", "0%"),
        emptyStatsRow("50", "6 569", "178", "413", "50%", "9.6%"),
        emptyStatsRow("60", "8 241", "223", "519", "50%", "19.2%"),
        emptyStatsRow("70", "9 720", "264", "612", "50%", "19.2%"),
        emptyStatsRow("80", "11 208", "304", "705", "50%", "28.8%"),
        emptyStatsRow("90", "12 704", "344", "799", "50%", "38.4%"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Способности",
      body: `Геймплей — стойка **Танца тени** после Е и заряженные **Игра химер** (урон тени = **Лунная бутонизация**). Союзники копят бутоны → Е превращает их в **Семена лжи** → поглощение даёт **Завесу ложных тайн** → усиленные заряженные. Подробные таблицы — во вкладке **Билд → Таланты**.

### Приоритет прокачки
**Е > Q > обычные** (обычные почти не нужны вне стойки).

### Активные навыки
- **Змеиный удар** — до 4 ударов Дендро; заряженная — **Скользящая змея** (до 2.5 сек.); в стойке Е заряженная → **Игра химер**.
- **Стратегия сенета: Танец тысячи ночей (Е)** — Дендро по площади + **Танец тени** на **9 сек.** (откат **9**, 2 заряда). При Зелёной росе заряженные → Игра химер (Нефер + тени); 3 заряженных завершают стойку.
- **Священная клятва: Химера истинного взора (Q)** — 2 удара АТК+МС по площади; тратит все стаки **Завесы** на бонус урона. **60** энергии, откат **15**.

### Пассивки
- **Пари лунного света** — при Высшем сиянии Е превращает ядра в **Семена лжи**; поглощение → стаки Завесы (+МС при 3 стаках).
- **Дочь пыли и песка** — в Танце тени Скользящая змея даёт доп. **Зелёную росу** (сильнее от МС выше 500).
- **Дар лунного знамения: Коридор сумеречных теней** — Бутонизация → Лунная; +**0.0175%** базового урона ЛБ за 1 МС (макс. **14%**); +1 Знамение.
- **Заговор золотой палаты** — +**25%** наград экспедиций Нод-Края (20 ч).`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Как играть и стоит ли выбивать",
      body: `### Ротация
1. Способности союзников — баффы и Гидро/Дендро для бутонов.
2. Нефер: **Е** (Танец тени + Семена лжи).
3. **3× Игра химер** (поглощение семян / Завеса).
4. Снова **Е** → ещё **3×** заряженные.
5. **Q** при готовности (съедает Завесы ради урона).
6. Повтор по откатам.

> Порядок: **саппорты → Е → 3 заряженных → Е → 3 заряженных → Q**.

### Стоит ли выбивать?
Сильный мейн-дд уровня топа, но **только** в отрядах Лунной бутонизации и с героем Нод-Края. Без Лаумы и готовой команды польза резко падает.

### С1 или сигна?
- **Сигна** — если альтернатива только крафтовый Фонарь.
- **С1** — если уже есть сильное оружие (Ноктюрн / Зеркало / Р5 Иней): усиливает базовый урон ЛБ от Игры химер.

### Лаума или Коломбина?
**Лаума** важнее: без неё ~**−40%** личного урона. Коломбина даёт ~**+20%** и заменяется Айно; аналог Лаумы — лишь Нахида с посредственным результатом.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Лор",
      title: "Биография",
      body: `Нефер — хозяйка **Куратория тайн**, рассказчица и разведчица Нод-Края. В тизерах повествует о создании мира, лун и региона; сотрудники иногда считают её властной и пугающей.

Навыки открывают цепочку заданий вокруг **обмена информацией**. В игре её описывают как находчивую главу организации, торгующую тайнами — отсюда особое блюдо **«Тайны в обмен»** и титул **«Тайна под песками»**.`,
    },
  ];

  // Возвышение: мандаты — в БД часто только Заиндевевший; остальные через noteMissing.
  const matWorn = m("Потрепанный мандат");
  const matFine = m("Безупречный мандат");
  const matFrost = m("Заиндевевший мандат");

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Серебро захода луны"), "Серебро захода луны", 168, "local", 1),
    matCard(m("Сияющие рога"), "Сияющие рога", 46, "boss", 4),
    matCard(m("Осколок изумруда Нагадус"), "Осколок изумруда Нагадус", 1, "ascension", 2),
    matCard(m("Фрагмент изумруда Нагадус"), "Фрагмент изумруда Нагадус", 9, "ascension", 3),
    matCard(m("Кусок изумруда Нагадус"), "Кусок изумруда Нагадус", 9, "ascension", 4),
    matCard(m("Драгоценный изумруд Нагадус"), "Драгоценный изумруд Нагадус", 6, "ascension", 5),
    matCard(matWorn, "Потрепанный мандат", 18, "ascension", 1),
    matCard(matFine, "Безупречный мандат", 30, "ascension", 2),
    matCard(matFrost, "Заиндевевший мандат", 36, "ascension", 3),
    // ×3 таланта до 10, как у Коломбины (wotpack — на 1 талант ×3/21/38)
    matCard(m("Учения о «Рае»"), "Учения о «Рае»", 9, "talent", 2),
    matCard(m("Указания о «Рае»"), "Указания о «Рае»", 63, "talent", 3),
    matCard(m("Философия о «Рае»"), "Философия о «Рае»", 114, "talent", 4),
    matCard(m("Вознёсшийся образец: Ладья"), "Вознёсшийся образец: Ладья", 18, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Опыт героя"), "Опыт героя", 421, "exp", 4),
    matCard(m("Мора"), "Мора", 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Нефер — Дендро мейн-дд Лунной бутонизации: билд, оружие, сеты, отряды и таланты.";

  const iconBase = "/images/talents/nefer";
  const cIconBase = "/images/constellations/nefer";
  const lv13 = Array.from({ length: 13 }, (_, i) => String(i + 1));

  // Honey Hunter L1–13
  const talents = [
    {
      id: "t_na",
      name: "Змеиный удар",
      icon: `${iconBase}/na.png`,
      description:
        "**Обычная атака:** до четырёх ударов — **Дендро урон**.\n\n**Заряженная:** состояние **Скользящей змеи** — быстрое перемещение до **2.5 сек.** с расходом выносливости. При отпускании кнопки, конце длительности или нехватке стамины выходит из состояния, тратит доп. выносливость и наносит **Дендро урон**. В **Танце тени** доп. расход снижен. Применение **Е** или спринта в Скользящей змее **не** сбрасывает состояние.\n\n**Удар в падении:** стремительное падение, затем **Дендро урон** по площади.",
      loreText: "Удар змеи — точен, быстр и не прощает оплошности.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон 1 удара",
          values: [
            "38.1%",
            "40.9%",
            "43.8%",
            "47.6%",
            "50.4%",
            "53.3%",
            "57.1%",
            "60.9%",
            "64.7%",
            "68.5%",
            "72.3%",
            "76.1%",
            "80.9%",
          ],
        },
        {
          label: "Урон 2 удара",
          values: [
            "37.6%",
            "40.4%",
            "43.2%",
            "47.0%",
            "49.8%",
            "52.6%",
            "56.4%",
            "60.1%",
            "63.9%",
            "67.6%",
            "71.4%",
            "75.1%",
            "79.8%",
          ],
        },
        {
          label: "Урон 3 удара",
          values: [
            "25.2%×2",
            "27.1%×2",
            "29.0%×2",
            "31.6%×2",
            "33.4%×2",
            "35.3%×2",
            "37.9%×2",
            "40.4%×2",
            "42.9%×2",
            "45.4%×2",
            "48.0%×2",
            "50.5%×2",
            "53.6%×2",
          ],
        },
        {
          label: "Урон 4 удара",
          values: [
            "61.0%",
            "65.6%",
            "70.1%",
            "76.2%",
            "80.8%",
            "85.4%",
            "91.5%",
            "97.6%",
            "103.7%",
            "109.8%",
            "115.9%",
            "122.0%",
            "129.6%",
          ],
        },
        {
          label: "Урон заряженной",
          values: [
            "130.9%",
            "140.7%",
            "150.5%",
            "163.6%",
            "173.4%",
            "183.2%",
            "196.3%",
            "209.4%",
            "222.5%",
            "235.6%",
            "248.7%",
            "261.8%",
            "278.1%",
          ],
        },
        {
          label: "Расход выносливости (зарядка)",
          values: Array(13).fill("18.2/сек."),
        },
        {
          label: "Расход выносливости (выход)",
          values: Array(13).fill("50"),
        },
        {
          label: "Расход в Танце тени (выход)",
          values: Array(13).fill("25"),
        },
        {
          label: "Урон в падении",
          values: [
            "56.8%",
            "61.5%",
            "66.1%",
            "72.7%",
            "77.3%",
            "82.6%",
            "89.9%",
            "97.1%",
            "104.4%",
            "112.3%",
            "120.3%",
            "128.2%",
            "136.1%",
          ],
        },
        {
          label: "Низкий / высокий удар",
          values: [
            "114% / 142%",
            "123% / 153%",
            "132% / 165%",
            "145% / 182%",
            "155% / 193%",
            "165% / 206%",
            "180% / 224%",
            "194% / 243%",
            "209% / 261%",
            "225% / 281%",
            "240% / 300%",
            "256% / 320%",
            "272% / 340%",
          ],
        },
      ],
      order: 0,
    },
    {
      id: "t_skill",
      name: "Стратегия сенета: Танец тысячи ночей",
      icon: `${iconBase}/skill.png`,
      description:
        "Бросок вперёд — **Дендро урон** по площади и состояние **Танца тени**.\n\nПока действует Танец тени и есть хотя бы **1 Зелёная роса**, заряженные атаки сменяются на **Игру химер** (без расхода выносливости). Сопротивление прерыванию повышено. **2** начальных заряда.\n\n**Игра химер:** Нефер и тени бьют по площади (урон теней = **Лунная бутонизация**). После каждой Игры при первом вызове тени тратится **1** Зелёная роса. Три заряженных завершают стойку.\n\nДлительность **9 сек.**, откат **9 сек.** Источник: АТК + МС.",
      loreText: "Мир — партия, где фигуры скрыты завесой. Собери все сведения — иначе попадёшь в ловушку.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон навыка",
          values: [
            ae("76.4", "152.8"),
            ae("82.1", "164.2"),
            ae("87.8", "175.7"),
            ae("95.5", "191.0"),
            ae("101.2", "202.4"),
            ae("106.9", "213.9"),
            ae("114.6", "229.2"),
            ae("122.2", "244.4"),
            ae("129.9", "259.7"),
            ae("137.5", "275.0"),
            ae("145.1", "290.3"),
            ae("152.8", "305.5"),
            ae("162.3", "324.6"),
          ],
        },
        {
          label: "Игра химер 1 удар (Нефер)",
          values: [
            ae("24.6", "49.3"),
            ae("26.5", "53.0"),
            ae("28.3", "56.7"),
            ae("30.8", "61.6"),
            ae("32.7", "65.3"),
            ae("34.5", "69.0"),
            ae("37.0", "73.9"),
            ae("39.4", "78.9"),
            ae("41.9", "83.8"),
            ae("44.4", "88.7"),
            ae("46.8", "93.6"),
            ae("49.3", "98.6"),
            ae("52.4", "104.7"),
          ],
        },
        {
          label: "Игра химер 2 удар (Нефер)",
          values: [
            ae("32.0", "64.1"),
            ae("34.4", "68.9"),
            ae("36.8", "73.7"),
            ae("40.0", "80.1"),
            ae("42.4", "84.9"),
            ae("44.8", "89.7"),
            ae("48.1", "96.1"),
            ae("51.3", "102.5"),
            ae("54.5", "108.9"),
            ae("57.7", "115.3"),
            ae("60.9", "121.7"),
            ae("64.1", "128.1"),
            ae("68.1", "136.1"),
          ],
        },
        {
          label: "Игра химер 1 удар (тени)",
          values: [
            "96% МС",
            "103.2% МС",
            "110.4% МС",
            "120% МС",
            "127.2% МС",
            "134.4% МС",
            "144% МС",
            "153.6% МС",
            "163.2% МС",
            "172.8% МС",
            "182.4% МС",
            "192% МС",
            "204% МС",
          ],
        },
        {
          label: "Игра химер 2 удар (тени)",
          values: [
            "96% МС",
            "103.2% МС",
            "110.4% МС",
            "120% МС",
            "127.2% МС",
            "134.4% МС",
            "144% МС",
            "153.6% МС",
            "163.2% МС",
            "172.8% МС",
            "182.4% МС",
            "192% МС",
            "204% МС",
          ],
        },
        {
          label: "Игра химер 3 удар (тени)",
          values: [
            "128% МС",
            "137.6% МС",
            "147.2% МС",
            "160% МС",
            "169.6% МС",
            "179.2% МС",
            "192% МС",
            "204.8% МС",
            "217.6% МС",
            "230.4% МС",
            "243.2% МС",
            "256% МС",
            "272% МС",
          ],
        },
        {
          label: "Заряды Игры химер",
          values: Array(13).fill("3"),
        },
        {
          label: "Длительность Танца тени",
          values: Array(13).fill("9 сек."),
        },
        {
          label: "Время отката",
          values: Array(13).fill("9 сек."),
        },
      ],
      order: 1,
    },
    {
      id: "t_burst",
      name: "Священная клятва: Химера истинного взора",
      icon: `${iconBase}/burst.png`,
      description:
        "Истинный взор Тота: **Дендро урон** по площади перед собой. При применении Нефер **поглощает все Завесы ложных тайн** и повышает урон текущего взрыва стихии.\n\n**Завеса ложных тайн:** от поглощения **Семян лжи** (пассивка); каждый стак усиливает урон **Игры химер** (в описании Q — бонус за стак). Макс. **3** стака (на С0), по **9 сек.**\n\nЭнергия **60**, откат **15 сек.** Источник: АТК + МС.",
      loreText: "Благословения царя ибисов в песнях жгучих песков — на деле скорее проклятия.",
      levelLabels: lv13,
      stats: [
        {
          label: "Урон 1 удара",
          values: [
            ae("224.6", "449.3"),
            ae("241.5", "483.0"),
            ae("258.3", "516.7"),
            ae("280.8", "561.6"),
            ae("297.7", "595.3"),
            ae("314.5", "629.0"),
            ae("337.0", "673.9"),
            ae("359.4", "718.9"),
            ae("381.9", "763.8"),
            ae("404.4", "808.7"),
            ae("426.8", "853.6"),
            ae("449.3", "898.6"),
            ae("477.4", "954.7"),
          ],
        },
        {
          label: "Урон 2 удара",
          values: [
            ae("337.0", "673.9"),
            ae("362.2", "724.5"),
            ae("387.5", "775.0"),
            ae("421.2", "842.4"),
            ae("446.5", "892.9"),
            ae("471.7", "943.5"),
            ae("505.4", "1010.9"),
            ae("539.1", "1078.3"),
            ae("572.8", "1145.7"),
            ae("606.5", "1213.1"),
            ae("640.2", "1280.5"),
            ae("673.9", "1347.8"),
            ae("716.0", "1432.1"),
          ],
        },
        {
          label: "Бонус урона за стак Завесы",
          values: [
            "13%",
            "16%",
            "19%",
            "22%",
            "25%",
            "28%",
            "31%",
            "34%",
            "37%",
            "40%",
            "43%",
            "46%",
            "49%",
          ],
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
      name: "Пари лунного света",
      icon: `${iconBase}/passive1.png`,
      description:
        "**Лунное знамение — Высшее сияние:** при применении Е все **Дендро ядра** на поле превращаются в **Семена лжи**. В следующие **15 сек.** Лунная бутонизация союзников рядом создаёт Семена лжи вместо ядер / Ядер изобилия. Семена **не** активируют Вегетацию и Цветение и **не** разрываются.\n\nПри заряженной атаке или **Игре химер** Нефер поглощает Семена в радиусе и получает **1** стак **Завесы ложных тайн** за семя. При **3** стаках или обновлении третьего МС повышается на **100** на **8 сек.**",
      order: 3,
    },
    {
      id: "t_p2",
      name: "Дочь пыли и песка",
      icon: `${iconBase}/passive2.png`,
      description:
        "В состоянии **Танца тени**: в течение **5 сек.** после Лунной бутонизации союзника состояние **Скользящей змеи** даёт дополнительную **Зелёную росу**. За каждые **100 МС** свыше **500** эффект усиливается на **10%** (макс. **+50%**).",
      order: 4,
    },
    {
      id: "t_p3",
      name: "Дар лунного знамения: Коридор сумеречных теней",
      icon: `${iconBase}/passive3.png`,
      description:
        "Когда союзник вызывает **Бутонизацию**, реакция конвертируется в **Лунную бутонизацию**. Базовый урон ЛБ растёт на **0.0175%** за каждую ед. МС Нефер (макс. **+14%**).\n\nПока она в отряде, уровень **Лунного знамения** повышается на **1**.",
      order: 5,
    },
    {
      id: "t_util",
      name: "Заговор золотой палаты",
      icon: `${iconBase}/utility.png`,
      description:
        "Награды за экспедиции в **Нод-Крае** длительностью **20 ч.** повышаются на **25%**. Как глава Куратория тайн умеет добывать сведения, интересные разным фракциям города.",
      order: 6,
    },
  ];

  const constellations = [
    {
      id: "c1",
      level: 1,
      name: "Успех начинается с плана",
      icon: `${cIconBase}/c1.png`,
      description:
        "Базовый урон **Лунной бутонизации** от **Игры химер** повышается на **60%** МС Нефер. Эффект также усиливается **Завесой ложных тайн**.",
      order: 0,
    },
    {
      id: "c2",
      level: 2,
      name: "Осведомлённость питает стратегию",
      icon: `${cIconBase}/c2.png`,
      description:
        "Усиливает **Пари лунного света**: длительность Завесы **+5 сек.**, лимит стаков до **5**, урон Игры химер до **140%**. При Е сразу **2** стака Завесы. При **5** стаках / обновлении пятого МС **+200** на **8 сек.**\n\nНужно открыть пассивку «Пари лунного света».",
      order: 1,
    },
    {
      id: "c3",
      level: 3,
      name: "Обман скрывает истину",
      icon: `${cIconBase}/c3.png`,
      description:
        "Уровень навыка **Стратегия сенета: Танец тысячи ночей** +**3** (макс. **15**).",
      order: 2,
    },
    {
      id: "c4",
      level: 4,
      name: "Заблуждения опутывают разум",
      icon: `${cIconBase}/c4.png`,
      description:
        "Пока Нефер на поле в **Танце тени**, **Зелёная роса** копится на **25%** быстрее. Дендро-сопротивление врагов рядом **−20%**. После выхода из стойки или отдаления эффект снимается через **4.5 сек.**",
      order: 3,
    },
    {
      id: "c5",
      level: 5,
      name: "Возможности кроются в мгновениях",
      icon: `${cIconBase}/c5.png`,
      description:
        "Уровень навыка **Священная клятва: Химера истинного взора** +**3** (макс. **15**).",
      order: 4,
    },
    {
      id: "c6",
      level: 6,
      name: "Победа в переломный момент",
      icon: `${cIconBase}/c6.png`,
      description:
        "При **Игре химер** второй этап урона Нефер становится Дендро по площади, равным **85%** МС. После серии ударов — доп. Дендро по площади на **120%** МС (считается ЛБ от Игры химер).\n\n**Лунное знамение — Высшее сияние:** урон Лунной бутонизации Нефер **возвышается на 15%**.",
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
