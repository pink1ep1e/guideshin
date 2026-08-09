import { slugFromName } from "@/lib/slug";

export type GuideLinkIndex = {
  charactersByKey: Map<
    string,
    { slug: string; name: string; image: string | null }
  >;
  weaponsByKey: Map<
    string,
    { slug: string; name: string; image: string | null }
  >;
};

function normalizeKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[''`´]/g, "")
    .replace(/[-–—_./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Частые EN-имена из API → как в RU-базе Guideshin (на случай импорта не на русском). */
const EN_TO_RU: Record<string, string> = {
  "raiden shogun": "райдэн",
  raiden: "райдэн",
  wanderer: "странник",
  "hu tao": "ху тао",
  hutao: "ху тао",
  "kamisato ayaka": "аяка",
  ayaka: "аяка",
  "kamisato ayato": "аято",
  ayato: "аято",
  "kaedehara kazuha": "кадзуха",
  kazuha: "кадзуха",
  "arataki itto": "итто",
  itto: "итто",
  "yae miko": "яэ мико",
  "kuki shinobu": "синобу",
  shinobu: "синобу",
  "shikanoin heizou": "хэйдзо",
  heizou: "хэйдзо",
  "yun jin": "юнь цзинь",
  shenhe: "шэнь хэ",
  yelan: "е лань",
  alhaitham: "аль-хайтам",
  "al haitham": "аль-хайтам",
  baizhu: "бай чжу",
  xianyun: "сянь юнь",
  gaming: "ка мин",
  navia: "навия",
  chevreuse: "шеврёз",
  furina: "фурина",
  charlotte: "шарлотта",
  wriothesley: "ризли",
  neuvillette: "нёвиллет",
  lyney: "лини",
  freminet: "фремине",
  lynette: "линетт",
  arlecchino: "арлекино",
  clorinde: "клоринда",
  sigewinne: "сиджвин",
  emilie: "эмилия",
  mualani: "мулань",
  kinich: "кинич",
  xilonen: "шилонен",
  chasca: "часка",
  mavuika: "мавуика",
  citlali: "ситлали",
  "lan yan": "лань янь",
  "yumemizuki mizuki": "мидзуки",
  escoffier: "эскофье",
  ineffa: "инеффа",
  lauma: "лаума",
  flins: "флинс",
  aino: "айно",
  columbina: "коломбина",
  nahida: "нахида",
  nilou: "нилу",
  cyno: "сайно",
  tighnari: "тигнари",
  dehya: "дэхья",
  faruzan: "фарузан",
  layla: "лайла",
  candace: "кандакия",
  collei: "коллеи",
  kokomi: "кокоми",
  "sangonomiya kokomi": "кокоми",
  yoimiya: "ёимия",
  sayu: "саю",
  sara: "сара",
  "kujou sara": "сара",
  thoma: "тома",
  gorou: "горо",
  zhongli: "чжун ли",
  ganyu: "гань юй",
  xiao: "сяо",
  keqing: "кэ цин",
  qiqi: "ци ци",
  mona: "мона",
  diluc: "дилюк",
  jean: "джинн",
  venti: "венти",
  klee: "кли",
  tartaglia: "тарталья",
  childe: "тарталья",
  albedo: "альбедо",
  eula: "эола",
  rosaria: "розария",
  yanfei: "янь фэй",
  amber: "эмбер",
  lisa: "лиза",
  kaeya: "кэя",
  barbara: "барбара",
  noelle: "ноэлль",
  bennett: "бэннет",
  xiangling: "сян лин",
  xingqiu: "син ця",
  chongyun: "чунь юнь",
  beidou: "бэй доу",
  ningguang: "нин гуан",
  fischl: "фишль",
  razor: "рэйзор",
  sucrose: "сахароза",
  diona: "диона",
  xinyan: "синь янь",
};

function aliasKeys(name: string): string[] {
  const key = normalizeKey(name);
  const keys = new Set<string>([key]);
  const mapped = EN_TO_RU[key];
  if (mapped) keys.add(normalizeKey(mapped));
  keys.add(key.replace(/\s+/g, ""));
  const slug = slugFromName(name);
  if (slug) keys.add(normalizeKey(slug.replace(/-/g, " ")));
  return [...keys];
}

export function buildGuideLinkIndex(input: {
  characters: { slug: string; name: string; image?: string | null }[];
  weapons: { slug: string; name: string; image?: string | null }[];
}): GuideLinkIndex {
  const charactersByKey = new Map<
    string,
    { slug: string; name: string; image: string | null }
  >();
  const weaponsByKey = new Map<
    string,
    { slug: string; name: string; image: string | null }
  >();

  for (const c of input.characters) {
    const entry = { slug: c.slug, name: c.name, image: c.image ?? null };
    for (const k of aliasKeys(c.name)) charactersByKey.set(k, entry);
    charactersByKey.set(normalizeKey(c.slug.replace(/-/g, " ")), entry);
    charactersByKey.set(normalizeKey(c.slug), entry);
  }

  for (const w of input.weapons) {
    const entry = { slug: w.slug, name: w.name, image: w.image ?? null };
    for (const k of aliasKeys(w.name)) weaponsByKey.set(k, entry);
    weaponsByKey.set(normalizeKey(w.slug.replace(/-/g, " ")), entry);
  }

  return { charactersByKey, weaponsByKey };
}

export function resolveGuideHref(
  itemName: string,
  itemType: string,
  index: GuideLinkIndex,
): string | null {
  return resolveGuideMeta(itemName, itemType, index)?.href ?? null;
}

export function resolveGuideMeta(
  itemName: string,
  itemType: string,
  index: GuideLinkIndex,
): { href: string; image: string | null; slug: string } | null {
  const isWeapon = /weapon|оруж/i.test(itemType);

  const tryMap = (
    map: GuideLinkIndex["charactersByKey"],
    kind: "weapon" | "character",
  ) => {
    for (const k of aliasKeys(itemName)) {
      const hit = map.get(k);
      if (hit) {
        return {
          href:
            kind === "weapon"
              ? `/wiki/weapons/${hit.slug}`
              : `/wiki/characters/${hit.slug}`,
          image: hit.image,
          slug: hit.slug,
        };
      }
    }
    return null;
  };

  if (isWeapon) {
    return (
      tryMap(index.weaponsByKey, "weapon") ||
      tryMap(index.charactersByKey, "character")
    );
  }

  return (
    tryMap(index.charactersByKey, "character") ||
    tryMap(index.weaponsByKey, "weapon")
  );
}
