/**
 * Импорт гайда на Коломбину (по материалам wotpack.ru).
 * Использует новые блоки GuideBuilder: prosCons, statTargets, rankedList и т.д.
 *
 *   npx tsx scripts/seed-kolombina-guide.ts
 */
import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";
import { PrismaClient, Rarity, Element } from "@prisma/client";
import {
  type GuideBlock,
  type GuideRankedItem,
  type GuideTeamMember,
  type GuideRoleRow,
  serializeGuide,
  uid,
  emptyStatsRow,
} from "@/lib/guide-builder";
import { ELEMENT_SVG, type ElementKey } from "@/lib/genshin";
import type { CharacterMaterial } from "@/lib/character-materials";

const prisma = new PrismaClient();

const SLUG = "kolombina";
const NAME = "Коломбина";
const IMAGE = "/uploads/icons/kolombina.png";
const SPLASH = "/uploads/splash/kolombina.jpg";

const STUB_DIR = path.join(process.cwd(), "public", "uploads", "artifacts", "stubs");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const ARTIFACT_STUBS = [
  {
    file: "rassvetnaya-pesn.png",
    url: "https://wotpack.ru/wp-content/uploads/2025/12/rassvetnaya-pesn-zvezdy-i-luny-ikonka.png",
  },
  {
    file: "serenada.png",
    url: "https://wotpack.ru/wp-content/uploads/2025/07/set-iz-nod-kraya-na-ve-i-baff-ms-220x220.png",
  },
  {
    file: "noch-otkrytiya-neba.png",
    url: "https://wotpack.ru/wp-content/uploads/2025/09/noch-otkrytiya-neba-220x220.png",
  },
] as const;

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

type ArtStub = { name: string; image: string; rarity: 4 | 5 };

async function ensureArtifactStubs(): Promise<string[]> {
  await mkdir(STUB_DIR, { recursive: true });
  const missing: string[] = [];
  for (const s of ARTIFACT_STUBS) {
    const dest = path.join(STUB_DIR, s.file);
    try {
      const st = await stat(dest);
      if (st.size > 1000) continue;
    } catch {
      /* missing */
    }
    try {
      const res = await fetch(s.url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      console.log("Downloaded stub:", s.file, `(${buf.length} bytes)`);
    } catch (e) {
      console.warn("Failed stub download:", s.file, e);
      missing.push(s.file);
    }
  }
  return missing;
}

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
): GuideRankedItem {
  if (w) {
    return {
      id: uid(),
      rank,
      name: w.name,
      image: w.image,
      rarity: rarityStars(w.rarity),
      href: `/wiki/weapons/${w.slug}`,
      subtitle,
      effect,
      verdict,
    };
  }
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: "",
    rarity: 5,
    subtitle,
    effect,
    verdict: `Нет в базе. ${verdict}`,
  };
}

function rankedArt(
  a: ArtifactRow | ArtStub | undefined,
  rank: number,
  fallbackName: string,
  subtitle: string,
  effect: string,
  verdict: string,
): GuideRankedItem {
  if (a && "slug" in a) {
    return {
      id: uid(),
      rank,
      name: a.name,
      image: a.image,
      rarity: rarityStars(a.rarity),
      href: `/wiki/artifacts/${a.slug}`,
      subtitle,
      effect,
      verdict,
    };
  }
  if (a && "image" in a) {
    return {
      id: uid(),
      rank,
      name: a.name,
      image: a.image,
      rarity: a.rarity,
      subtitle,
      effect,
      verdict,
    };
  }
  return {
    id: uid(),
    rank,
    name: fallbackName,
    image: "",
    rarity: 5,
    subtitle,
    effect,
    verdict,
  };
}

function member(c: CharRow | undefined, fallbackName: string, role?: string): GuideTeamMember {
  if (c) {
    return {
      id: uid(),
      name: c.name,
      image: c.image,
      elementIcon: elIcon(c.element),
      rarity: rarityStars(c.rarity),
      href: `/wiki/characters/${c.slug}`,
      role,
    };
  }
  return {
    id: uid(),
    name: fallbackName,
    image: "",
    elementIcon: ELEMENT_SVG.HYDRO,
    rarity: 5,
    role,
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
      image: c.image,
      element: elLabel(c.element),
      elementIcon: elIcon(c.element),
      weapon,
      weaponIcon: "",
      description,
      href: `/wiki/characters/${c.slug}`,
    };
  }
  return {
    id: uid(),
    name: fallbackName,
    image: "",
    element: "—",
    elementIcon: ELEMENT_SVG.HYDRO,
    weapon,
    weaponIcon: "",
    description,
  };
}

function matCard(
  m: MatRow | undefined,
  name: string,
  qty: number,
  category: CharacterMaterial["category"],
  rarityStars = 1,
): CharacterMaterial {
  return {
    id: uid(),
    name: m?.name || name,
    image: m?.image || "",
    qty,
    category,
    rarityStars: m?.rarityStars || rarityStars,
  };
}

async function main() {
  const failedStubs = await ensureArtifactStubs();

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

  const stub = (file: string, name: string): ArtStub => ({
    name,
    image: `/uploads/artifacts/stubs/${file}`,
    rarity: 5,
  });

  const self = (role?: string): GuideTeamMember => ({
    id: uid(),
    name: NAME,
    image: IMAGE,
    elementIcon: ELEMENT_SVG.HYDRO,
    rarity: 5,
    href: `/wiki/characters/${SLUG}`,
    role,
  });

  const weaponItems: GuideRankedItem[] = [
    rankedWeapon(
      w("Вызов ноктюрна"),
      1,
      "Вызов ноктюрна",
      "Сигна · топ-1",
      "HP, энергия и огромный К/У Лунных реакций. Пассивка работает из кармана: после Лунных реакций восстанавливает энергию и даёт Священное вино.",
      "Лучший выбор. Требования к ВЭ падают ~на 25%; в артефактах сильнее добивайте К/Ш. Дорогое вложение, но максимизирует личный урон и баффы.",
    ),
    rankedWeapon(
      w("Лови волну"),
      2,
      "Лови волну",
      "Сильный HP + К/У",
      "Много HP и крит. урона. Пассивка на обычные/Пар почти не нужна Субретке, но сырые статы отличные для карманного дамага.",
      "Отличная альтернатива сигне, если уже есть на аккаунте. Хорошо закрывает HP и криты без сложной сборки.",
    ),
    rankedWeapon(
      w("Шкатулка истин"),
      3,
      "Шкатулка истин",
      "Под Лунную бутонизацию",
      "Сильна в отрядах Бутонизации: криты и бонусы под реакцию. В командах Флинса/Цзы Бай даёт в основном крит. статы.",
      "Берите под Нефер/Лауму. В Заряде и Кристалле уступает вариантам с HP и ВЭ.",
    ),
    rankedWeapon(
      w("Обряд вечного течения"),
      4,
      "Обряд вечного течения",
      "HP + К/У · драйвер",
      "HP и К/У; пассивка раскрывается при игре на поле. Подходит редкому драйвер-билду с Лунной бутонизацией и Фуриной.",
      "Не для классического кармана. Имеет смысл только если сознательно катите Коломбину как драйвера.",
    ),
    rankedWeapon(
      w("Жертвенный нефрит"),
      5,
      "Жертвенный нефрит",
      "Лучший 4★",
      "К/Ш, HP и МС из кармана (после 5 сек вне поля). Существенно удешевляет крит. сборку.",
      "Лучший 4★ из БП. Ставьте, если нет сильных 5★ и нужно стабильно закрыть К/Ш + HP.",
    ),
    rankedWeapon(
      w("Прототип: Янтарь", "Прототип: Янтарь"),
      6,
      "Прототип: Янтарь",
      "Хил + энергия",
      "Восстановление энергии и лечение союзников от ульты. Крафтовый F2P-вариант.",
      "Когда нет хилера/щитовика или бой очень тяжёлый. Особенно удобен без С1 Лаумы на Нахиде.",
    ),
    rankedWeapon(
      w("Зеркало прядильщицы ночи"),
      7,
      "Зеркало прядильщицы ночи",
      "Бафф Бутонизации",
      "Бафферский катализатор под Дендро-реакции. Усиливает Бутонизацию отряда.",
      "Под Нефер/Лауму. Без Лаумы — ситуативно; в Заряде/Кристалле обычно слабее HP-вариантов.",
    ),
    rankedWeapon(
      w("Кодекс Фавония"),
      8,
      "Кодекс Фавония",
      "Частицы энергии",
      "Крит. шанс и частицы энергии всей группе при критах. Классика саппортов.",
      "Особенно полезен с Флинсом и когда Коломбина — единственный Гидро. Жертвуем личным уроном ради ВЭ отряда.",
    ),
    rankedWeapon(
      w("Вихрь на волнах"),
      9,
      "Вихрь на волнах",
      "HP + ВЭ",
      "HP и восстановление энергии; хорошо держится от Е-шки. Сильнее с Гидро-резонансом.",
      "Комфортный вариант, если не хватает ульты. Уступает нефриту по критам, но проще закрывает ВЭ.",
    ),
    rankedWeapon(
      w("Фонарь чёрной сердцевины", "Фонарь черной сердцевины"),
      10,
      "Фонарь чёрной сердцевины",
      "Под Лунную бутонизацию",
      "Заточен под Дендро/Лунную бутонизацию. Баланс статов на Коломбине сложнее, чем у HP-катализаторов.",
      "Имеет смысл в ЛБ-отрядах, если оружие уже есть. Не универсальный выбор.",
    ),
    rankedWeapon(
      w("Великолепие лазурного свода"),
      11,
      "Великолепие лазурного свода",
      "HP + энергия",
      "Полезны HP и энергия; бонус элементального урона почти не нужен Субретке.",
      "Хорошо с С1 и Гео-командами (щит). Средний приоритет среди 5★.",
    ),
    rankedWeapon(
      w("Эпос о драконоборцах"),
      12,
      "Эпос о драконоборцах",
      "Бюджетный бафф АТК",
      "3★: HP Коломбине и бафф АТК активному персонажу после Е.",
      "Бюджет перед мейн-дд (например, Флинсом). Временно, пока нет 4★/5★.",
    ),
  ];

  const artItems: GuideRankedItem[] = [
    rankedArt(
      stub("rassvetnaya-pesn.png", "Рассветная песнь звезды и луны"),
      1,
      "Рассветная песнь звезды и луны",
      "Лучший 4 части",
      "2п — +80 МС. 4п — из кармана +20% урона Лунных реакций; при Высшем сиянии ещё +40% (сброс через 3 сек. на поле).",
      "Топ личного урона Субретки. Основной сет в большинстве нод-краевских отрядов.",
    ),
    rankedArt(
      stub("serenada.png", "Серенада шёлковой луны"),
      2,
      "Серенада шёлковой луны",
      "ВЭ + бафф МС",
      "2п — +20% ВЭ. 4п — Сияющая луна: Доверие (МС союзникам 60/120) и +10% урона реакций за каждый разный эффект Сияющей луны.",
      "Ставьте, если в команде нет другого носителя Серенады / когда Коломбина заменяет Айно.",
    ),
    rankedArt(
      stub("noch-otkrytiya-neba.png", "Ночь открытия неба"),
      3,
      "Ночь открытия неба",
      "Для драйвера",
      "Сильный сет для игры на поле. Из кармана заметно слабее Рассветной песни и Серенады.",
      "Ситуативно: драйвер с Инеффой. Не фармить специально под классический саппорт-карман.",
    ),
    rankedArt(
      a("Стойкость Миллелита"),
      4,
      "Стойкость Миллелита",
      "Временный / АТК-бафф",
      "2п HP; 4п — бафф АТК/щита при попадании Е. Не для Нефер/Цзы Бай.",
      "Не фармить специально. Временно как 2п HP или если нужен АТК-бафф мейн-дд.",
    ),
    rankedArt(
      a("Сияние Вурукаши", "Сияние сладкой росы"),
      5,
      "Сияние Вурукаши",
      "2 части HP",
      "2п — бонус HP. Удобно для 2+2 на здоровье, пока нет полного Рассветного набора.",
      "Временный 2+2 с Миллелитом. Полный 4п сет не приоритет.",
    ),
    rankedArt(
      a("Эмблема рассечённой судьбы", "Эмблема рассеченной судьбы"),
      6,
      "Эмблема рассечённой судьбы",
      "2 части ВЭ",
      "2п — +20% ВЭ. Пара с Серенадой, если критично добрать ульту.",
      "Обычно проще добрать ВЭ сабами, чем жертвовать HP. Используйте точечно.",
    ),
  ];

  const blocks: GuideBlock[] = [
    {
      id: uid(),
      type: "text",
      eyebrow: "Обзор",
      title: "О персонаже",
      body: `Коломбина (Гипоселениа, Куутар) — Гидро-катализатор 5★ из Нод-Края. Работает как саппорт и карманный дамагер: накладывает Гидро, усиливает Лунные реакции и конвертирует обычные Заряжен / Бутонизацию / Гидро Кристаллизацию в нод-краевские аналоги.

Лучше всего раскрывается в отрядах с героями Нод-Края (Флинс, Инеффа, Нефер, Лаума, Цзы Бай, Линнея). В «обычных» командах заметно слабее. Без созвездий почти не лечит — в сложном контенте нужен хилер или щитовик. Полный потенциал открывается с С2.

- Рейтинг: **S+**
- Редкость: 5★ · Оружие: катализатор · Возвышение: крит. шанс
- Регион: Нод-Край · Созвездие: Коломбина Гипоселениа
- Добавлена: 14 января 2026 (патч 6.3)

Как получить: молитва события персонажа. Реран во второй фазе версии 6.7 (21 июля — 11 августа 2026), баннер «Лунные сны».`,
    },
    {
      id: uid(),
      type: "prosCons",
      eyebrow: "Анализ",
      title: "Плюсы и минусы",
      prosTitle: "Преимущества",
      consTitle: "Недостатки",
      pros: [
        "Лучший саб-дд и саппорт под Лунные реакции (Бутонизация, Заряд, Кристалл). Дамагерам Нод-Края даёт ~+30% урона и закрывает потребность в комфортном Гидро.",
        "Нужны в основном криты и HP — сборку можно удешевить через максимизацию здоровья, без жёсткой гонки за бонусом элементального урона.",
        "Конвертирует обычные реакции в нод-краевские, открывая уникальные команды на старых героях и гибкие «гибридные» отряды.",
        "Удобный спринт и утилита в исследовании Нод-Края: воскрешение союзников и взаимодействие с куувяки.",
      ],
      cons: [
        "Почти не нужна компаньонам из других регионов: Пиро/Крио/Анемо ДД почти не получают пользы от её баффов к Лунным реакциям.",
        "На С0 играбельна, но сильно растёт с С1–С2 (удобство, урон, выживаемость) — без конст ощущается «сырой» в тяжёлом контенте.",
        "Мало подходящего оружия: нужны HP, криты и бонусы к урону реакций Нод-Края; бонус элементального урона почти бесполезен.",
      ],
    },
    {
      id: uid(),
      type: "statTargets",
      eyebrow: "Билд",
      title: "Рекомендуемые характеристики",
      intro:
        "Сборка зависит от роли, но база одна: HP для личного урона и исходящего баффа, криты для карманного дамага, восстановление энергии для постоянной ульты.",
      targets: [
        {
          id: uid(),
          label: "HP",
          value: "35 000+",
          hint: "Пассивка / до 7% баффа урона реакций",
        },
        {
          id: uid(),
          label: "ВЭ",
          value: "160–240%",
          hint: "160–180% с Гидро-резонансом + сигной; до 220–240% без сигны. Драйверу ВЭ не нужен",
        },
        {
          id: uid(),
          label: "К/Ш",
          value: "70–80%",
          hint: "С пассивкой база ~39.2%",
        },
        {
          id: uid(),
          label: "К/У",
          value: "150%+",
          hint: "Чем выше — тем лучше карманный урон",
        },
      ],
      slots: [
        { id: uid(), slot: "Цветок", main: "HP (фикс)", subs: "HP% · ВЭ% · К/У · К/Ш" },
        { id: uid(), slot: "Перо", main: "Сила атаки (фикс)", subs: "HP% · ВЭ% · К/У · К/Ш" },
        { id: uid(), slot: "Пески", main: "HP% или ВЭ%", subs: "HP% · ВЭ% · К/У · К/Ш" },
        { id: uid(), slot: "Кубок", main: "HP%", subs: "HP% · ВЭ% · К/У · К/Ш" },
        { id: uid(), slot: "Корона", main: "К/У или К/Ш", subs: "HP% · ВЭ% · К/У · К/Ш" },
      ],
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Оружие",
      title: "Рейтинг оружия",
      intro:
        "Приоритет: HP, криты и бонусы к Лунным реакциям. Бонус элементального урона почти бесполезен. Ниже — полный рейтинг от сигнатурки до бюджетного 3★.",
      kind: "weapons",
      items: weaponItems,
    },
    {
      id: uid(),
      type: "rankedList",
      eyebrow: "Артефакты",
      title: "Рейтинг артефактов",
      intro:
        "Основной выбор — полный Рассветный набор. Серенада — если в отряде нет другого носителя. Временно: 2+2 HP (Миллелит + Вурукаша) или 2+2 ВЭ (Эмблема + Серенада), если критично добрать ульту.",
      kind: "artifacts",
      items: artItems,
    },
    {
      id: uid(),
      type: "roleTable",
      eyebrow: "Нод-Край",
      title: "Приоритетные союзники",
      intro:
        "Лучшие компаньоны — герои Нод-Края. Старайтесь держать 2–3 таких персонажа для уровня Знамения и одного «внешнего» баффера.",
      rows: [
        roleRow(
          c("flins", "флинс"),
          "Флинс",
          "Копьё",
          "С Коломбиной тучи бьют чаще (~+30% DPS). С её С1 требования ВЭ Флинса −10%.",
        ),
        roleRow(
          c("ineffa", "инеффа"),
          "Инеффа",
          "Копьё",
          "Аналогичные бонусы; после замены Айно может носить Рассветную песнь, отдавая Серенаду Субретке.",
        ),
        roleRow(
          c("nefer", "нефер"),
          "Нефер",
          "Катализатор",
          "Сильно нуждается в Куутар: статус, бафф и +3 Росы для комфортной реакции.",
        ),
        roleRow(
          c("lauma", "лаума"),
          "Лаума",
          "Катализатор",
          "Без Субретки в отряде с Нефер тяжело прожимать заряженный навык из‑за Росы.",
        ),
        roleRow(
          c("czy-baj", "цзы бай"),
          "Цзы Бай",
          "Меч",
          "Гео ДД от стойки навыка; нужен стабильный статус из кармана.",
        ),
        roleRow(
          c("linneya", "линнея"),
          "Линнея",
          "Лук",
          "Саб-дд и лекарь из кармана через помощника с Е-шки.",
        ),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Лунная бутонизация",
      badge: "Топ",
      note: "Лаума обычно в Серенаде; Коломбине — Рассветная песнь. Без С1 Лаумы на Нахиду можно поставить Прототип: Янтарь.",
      members: [
        member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
        self("Саппорт"),
        member(c("lauma", "лаума"), "Лаума", "Саб-дд"),
        member(c("nahida", "нахида"), "Нахида", "Флекс"),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Лунный заряд",
      badge: "Топ",
      note: "Коломбина заменяет Айно и баффает Флинса с Инеффой. Сахароза — МС и помощь с элементами.",
      members: [
        member(c("flins", "флинс"), "Флинс", "Мейн-дд"),
        self("Саппорт"),
        member(c("ineffa", "инеффа"), "Инеффа", "Саб-дд"),
        member(c("sucrose", "сахароза"), "Сахароза", "Флекс"),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Лунный кристалл",
      badge: "Сигнатурный",
      note: "Линнея закрывает хил — Коломбине можно дать сигну или Кодекс Фавония (она единственный Гидро).",
      members: [
        member(c("czy-baj", "цзы бай"), "Цзы Бай", "Мейн-дд"),
        self("Саппорт"),
        member(c("illugi", "иллуги"), "Иллуги", "Саб-дд"),
        member(c("linneya", "линнея"), "Линнея", "Хил"),
      ],
    },
    {
      id: uid(),
      type: "team",
      title: "Бюджет",
      badge: "Гибко",
      note: "Без Лаумы: Нахида или Бай Чжу + Кокоми/Айно. Айно — носитель Серенады.",
      members: [
        member(c("nefer", "нефер"), "Нефер", "Мейн-дд"),
        self("Саппорт"),
        member(c("nahida", "нахида"), "Нахида", "Саб-дд"),
        member(c("kokomi", "кокоми"), "Кокоми", "Хил"),
      ],
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Команды",
      title: "Другие сильные и ситуативные отряды",
      body: `### Лунная бутонизация
- Нефер / Коломбина / Лаума / Сахароза (Инструктор)

### Лунный заряд
- Флинс / Коломбина / Оророн или Фишль / Ягода или Сахароза
- Флинс / Коломбина / Синобу (Инструктор) / Айно

### Лунный кристалл
- Цзы Бай / Коломбина / Иллуги / Горо или Шилонен (С2)
- Цзы Бай / Коломбина / Иллуги / Тиори или Чжун Ли
- Цзы Бай / Коломбина / Айно / Иллуги

### С «обычными» ДД
Слабее оригинальных нод-краевских, но рабоче:
- Нёвиллет / Коломбина / Инеффа / Лаума|Сахароза|Ягода
- Нилу / Коломбина / Лаума / Нахида|Бай Чжу
- Аль-Хайтам / Коломбина / Лаума / Синобу|Кокоми
- Навия / Коломбина / Иллуги / Линнея|Кокоми
- Итто|Ноэлль(С6) / Коломбина / Иллуги / Линнея|Горо
- Арлекино|Мавуика / Коломбина / Инеффа / Ягода|Сахароза
- Пар: Арлекино / Коломбина / Беннет / Кадзуха; Мавуика / Коломбина / Шилонен / Ситлали
- Заморозка/Таяние: Скирк / Коломбина / Эскофье / Фурина; Аяка|Гань Юй / Коломбина / Эскофье|Шэнь Хэ / Кадзуха
- Бутонизация/Вегетация/Заряд: Нахида / Коломбина / Е Лань|Син Цю / Синобу; Нилу / Коломбина / Нахида / Бай Чжу|Кокоми`,
    },
    {
      id: uid(),
      type: "statsTable",
      title: "Характеристики: что повышается при возвышении",
      intro:
        "Основная характеристика при возвышении — крит. шанс. На 90 уровне без оружия и артефактов К/Ш = 24.2%. Качайте до 90; уровни 95/100 через Блуждающую удачу желательны, но не критичны.",
      colLabels: [
        "Уровень",
        "Базовое HP",
        "Базовая сила атаки",
        "Базовая защита",
        "Базовый крит. шанс",
        "Крит. шанс с возвышения",
      ],
      rows: [
        emptyStatsRow("1", "1192", "19", "54", "5%", "0%"),
        emptyStatsRow("20", "3092", "50", "140", "5%", "0%"),
        emptyStatsRow("40", "6127", "98", "278", "5%", "4.8%"),
        emptyStatsRow("50", "7896", "127", "359", "5%", "9.6%"),
        emptyStatsRow("60", "9925", "159", "451", "5%", "9.6%"),
        emptyStatsRow("70", "11724", "188", "532", "5%", "14.4%"),
        emptyStatsRow("80", "13532", "217", "615", "5%", "19.2%"),
        emptyStatsRow("90", "15307", "244", "696", "5%", "24.2%"),
      ],
    },
    {
      id: uid(),
      type: "resourceTable",
      title: "Возвышение",
      intro: "Материалы для возвышения Коломбины (Нод-Край и боссы):",
      rows: [
        {
          id: uid(),
          name: m("Осколок лазурита Варунада")?.name || "Лазурит Варунада",
          image: m("Осколок лазурита Варунада")?.image || "",
          qty: "1→9→9→6",
          where: "Еженедельные и мировые боссы (серия лазурита Варунада)",
          href: m("Осколок лазурита Варунада")
            ? `/wiki/materials/${m("Осколок лазурита Варунада")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Сияющие рога")?.name || "Сияющие рога",
          image: m("Сияющие рога")?.image || "",
          qty: "46",
          where: "Мировой босс «Повелитель морозной ночи»",
          href: m("Сияющие рога") ? `/wiki/materials/${m("Сияющие рога")!.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Шпороцветник")?.name || "Шпороцветник",
          image: m("Шпороцветник")?.image || "",
          qty: "168",
          where: "Острова Нод-Края",
          href: m("Шпороцветник") ? `/wiki/materials/${m("Шпороцветник")!.slug}` : undefined,
        },
        {
          id: uid(),
          name: "Слизь / Выделения / Концентрат слайма",
          image: m("Слизь слайма")?.image || "",
          qty: "18 / 30 / 36",
          where: "Слаймы по всему Тейвату",
          href: m("Слизь слайма") ? `/wiki/materials/${m("Слизь слайма")!.slug}` : undefined,
        },
        {
          id: uid(),
          name: m("Мора")?.name || "Мора",
          image: m("Мора")?.image || "",
          qty: "1 653 000",
          where: "Игровые активности",
          href: m("Мора") ? `/wiki/materials/${m("Мора")!.slug}` : undefined,
        },
      ],
    },
    {
      id: uid(),
      type: "materials",
      title: "Материалы талантов (на 1 способность)",
      items: [
        {
          id: uid(),
          name: m("Учения о «Лунном свете»")?.name || "Учения о «Лунном свете»",
          image: m("Учения о «Лунном свете»")?.image || "",
          rarity: 4,
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
          rarity: 4,
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
          rarity: 4,
          note: "×38",
          qty: "38",
          href: m("Философия о «Лунном свете»")
            ? `/wiki/materials/${m("Философия о «Лунном свете»")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Маска мудрого лекаря")?.name || "Маска мудрого лекаря",
          image: m("Маска мудрого лекаря")?.image || "",
          rarity: 5,
          note: "×6 · еженед. босс",
          qty: "6",
          href: m("Маска мудрого лекаря")
            ? `/wiki/materials/${m("Маска мудрого лекаря")!.slug}`
            : undefined,
        },
        {
          id: uid(),
          name: m("Корона прозрения")?.name || "Корона прозрения",
          image: m("Корона прозрения")?.image || "",
          rarity: 5,
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
      type: "text",
      eyebrow: "Таланты",
      title: "Способности и приоритет прокачки",
      body: `Роль: усиливает союзников Нод-Края ультой, дамажит и даёт статус с Е-шки, подстраиваясь под доминирующую Лунную реакцию.

### Активные
- **Ливень лунных рос** — обычные/заряженные/падение. Обычные от АТК; «Очищение лунной росой» (при Зелёной росе) — Дендро AoE от HP, считается Лунной бутонизацией, без выносливости.
- **Вечные приливы (Е)** — от HP, 25 сек / КД 17. Создаёт Зыбь тяготения: следует за активным, бьёт Гидро AoE, копит Силу тяготения от Лунных реакций. На максимуме — Вмешательство тяготения. При Высшем сиянии площадь больше.
- **Тоска во свете луны (Q)** — от HP, 60 энергии, 20 сек / КД 15. Владения луны повышают урон Лунных реакций отряда.

### Пассивки
- **Зов лунного безумия** — до +15% К/Ш за стаки после Вмешательства.
- **Закон новолуния** — бонусы Лунным реакциям во Владениях.
- **Дар лунного знамения** — конвертация Заряда/Бутонизации/Гидро Кристаллизации + до +7% урона реакций от HP; +1 к уровню Знамения.
- **Бдение луны** — воскрешение в Нод-Крае раз в 100 сек.

### Приоритет
Е ≥ Q > обычные (обычные — только если драйвер). После 6 ур. сильнее качайте Е.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Созвездия",
      title: "Созвездия C1–C6",
      body: `Прирост урона относительно С0 (ориентир): С1 +4.6% · С2 +22.7% · С3 +29.9% · С4 +42.9% · С5 +48.7% · С6 +85.3%.

### С1 «Сияние над цветами и вершинами»
Сразу активирует Гравитационное возмущение (раз в 15 сек) + эффекты под реакцию (энергия / сопротивление прерыванию / щит). Ключевой комфорт для Флинса, Нефер, Цзы Бай.

### С2 «Сопровождая в ночном пути»
Быстрее стаки +40% HP и баффы АТК/МС/Защиты активного от HP Коломбины. Очень сильная конста.

### С3 / С5
Уровни Е / Q.

### С4
Энергия и доп. множители реакций от HP.

### С6
+80% К/У элементам, участвующим в реакциях во Владениях (не стакается на один элемент).

**Лучшие:** С1, С2, С6.

### С1 или сигнатурка?
- **С1** — если нужны комфорт мейн-дд (щит для Цзы Бай, энергия Флинса, прерывание Нефер).
- **Сигна** — когда команда уже комфортна, а хочется статов и энергии самой Коломбине.`,
    },
    {
      id: uid(),
      type: "text",
      eyebrow: "Геймплей",
      title: "Ротация, вердикт и лор",
      body: `### Ротация
Базовый порядок: Е → Q → саб-дд/саппорты → ротация мейн-дд, пока живут Зыбь тяготения и Владения луны.

1. Начните с Коломбины: Е для статуса, затем Q. Если ульта не готова — вернитесь к ней после отката.
2. Прожмите саппортов и саб-дд. Коломбина копит Силу тяготения и бьёт Вмешательством примерно каждые 6 сек (быстрее с С1–С2).
3. Полностью отыграйте мейн-дд под баффами.
4. Повторяйте по откату.

Ульту нужно иметь в каждой ротации — заранее наберите ВЭ.

### Стоит ли выбивать?
Сборка дешёвая и геймплей простой, но Коломбина сильно завязана на Лунные реакции. Полноценно нужна тем, кто усиливает готовые отряды Нод-Края. Без них её часто перекрывают другие Гидро саб-дд.

### Лор
Дева Луны из Нод-Края (~500 лет), почиталась Детьми Морозной Луны как Куутар, позже — Предвестник Фатуи «Субретка». Вернулась на Хийси в Чертог Серебряной Луны; история — в задании «Песнь полой луны».`,
    },
  ];

  const levelMaterials: CharacterMaterial[] = [
    matCard(m("Шпороцветник"), "Шпороцветник", 168, "local", 1),
    matCard(m("Сияющие рога"), "Сияющие рога", 46, "boss", 4),
    matCard(m("Осколок лазурита Варунада"), "Осколок лазурита Варунада", 1, "ascension", 2),
    matCard(m("Фрагмент лазурита Варунада"), "Фрагмент лазурита Варунада", 9, "ascension", 3),
    matCard(m("Кусок лазурита Варунада"), "Кусок лазурита Варунада", 9, "ascension", 4),
    matCard(m("Драгоценный лазурит Варунада"), "Драгоценный лазурит Варунада", 6, "ascension", 5),
    matCard(m("Слизь слайма"), "Слизь слайма", 18, "ascension", 1),
    matCard(m("Выделения слайма"), "Выделения слайма", 30, "ascension", 2),
    matCard(m("Концентрат слайма"), "Концентрат слайма", 36, "ascension", 3),
    matCard(m("Учения о «Лунном свете»"), "Учения о «Лунном свете»", 9, "talent", 2),
    matCard(m("Указания о «Лунном свете»"), "Указания о «Лунном свете»", 63, "talent", 3),
    matCard(m("Философия о «Лунном свете»"), "Философия о «Лунном свете»", 114, "talent", 4),
    matCard(m("Маска мудрого лекаря"), "Маска мудрого лекаря", 18, "talent", 5),
    matCard(m("Корона прозрения"), "Корона прозрения", 3, "talent", 5),
    matCard(m("Мора"), "Мора", 1653000 + 1653000, "exp", 3),
  ];

  const contentHtml = serializeGuide(blocks);
  const shortDesc =
    "Гайд на Коломбину: билды, оружие, артефакты, отряды Нод-Края, таланты и созвездия.";

  const minOrder = await prisma.character.aggregate({ _min: { order: true } });
  const order = (minOrder._min.order ?? 1) - 1;

  const row = await prisma.character.upsert({
    where: { slug: SLUG },
    create: {
      slug: SLUG,
      name: NAME,
      image: IMAGE,
      splashImage: SPLASH,
      rarity: Rarity.LEGEND,
      element: Element.HYDRO,
      weaponType: "Катализатор",
      region: "Нод-края",
      sticker: "Новый",
      shortDesc,
      contentHtml,
      levelMaterials,
      published: true,
      order,
    },
    update: {
      name: NAME,
      image: IMAGE,
      splashImage: SPLASH,
      rarity: Rarity.LEGEND,
      element: Element.HYDRO,
      weaponType: "Катализатор",
      region: "Нод-края",
      sticker: "Новый",
      shortDesc,
      contentHtml,
      levelMaterials,
      published: true,
      order,
    },
  });

  const typeCounts = blocks.reduce<Record<string, number>>((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});

  console.log("Upserted", row.id, row.slug, row.name);
  console.log("Block types:", typeCounts);
  console.log(
    "Weapons:",
    weaponItems.map((i) => `${i.rank}. ${i.name}`).join("; "),
  );
  console.log(
    "Artifacts:",
    artItems.map((i) => `${i.rank}. ${i.name}${i.href ? "" : " [stub]"}`).join("; "),
  );
  console.log("Missing stub downloads:", failedStubs.join(", ") || "(none)");
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
