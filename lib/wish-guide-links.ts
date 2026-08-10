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
  chiori: "тиори",
  "kirara": "кирара",
  "ororon": "оророн",
  "iansan": "иансан",
  "varesa": "вареса",
  "skirk": "скирк",
  "dahila": "далила",
  // оружие
  "staff of homa": "посох хомы",
  "primordial jade winged spear": "нефритовый коршун",
  "primordial jade winged-spear": "нефритовый коршун",
  "jade winged spear": "нефритовый коршун",
  "jade winged-spear": "нефритовый коршун",
  "primordial jade wingedspear": "нефритовый коршун",
  "нефритовый крылатый копьё": "нефритовый коршун",
  "нефритовый крылатый копье": "нефритовый коршун",
  "нефритовый крылатый": "нефритовый коршун",
  "redhorn stonethresher": "краснорогий камнеруб",
  "skyward blade": "небесный меч",
  "skyward spine": "небесная ось",
  "skyward atlas": "небесный атлас",
  "skyward harp": "небесное крыло",
  "skyward pride": "небесное величие",
  "emerald orb": "изумрудный шар",
  "black tassel": "чёрная кисть",
  "debate club": "дубина переговоров",
  "thrilling tales of dragon slayers": "эпические сказания",
  "the widsith": "песнь разбитых струн",
  rust: "ржавый лук",
  "the flute": "флейта",
  "the bell": "меч-колокол",
  rainslasher: "дождерез",
  "favonius warbow": "боевой лук фавония",
  "favonius greatsword": "двуручный меч фавония",
  "favonius sword": "меч фавония",
  "favonius lance": "копьё фавония",
  "favonius codex": "кодекс фавония",
  "sacrificial sword": "церемониальный меч",
  "sacrificial greatsword": "церемониальный двуручный меч",
  "sacrificial bow": "церемониальный лук",
  "sacrificial fragments": "церемониальные мемуары",
  "lions roar": "львиный рёв",
  "lion's roar": "львиный рёв",
  "dragon bane": "гром дракона",
  "eye of perception": "острый глаз",
  "amos bow": "лук амоса",
  "wolfs gravestone": "волчья погибель",
  "wolf's gravestone": "волчья погибель",
  "aquila favonia": "меч сокола",
  "lost prayer to the sacred winds": "молитва святым ветрам",
  "memory of dust": "память о пыли",
  "vortex vanquisher": "покоритель вихря",
  "summit shaper": "камнерез",
  "the unforged": "некованый",
  "primordial jade cutter": "нефритовый резак",
  "freedom sworn": "клятва свободы",
  "mistsplitter reforged": "рассекающий туман",
  "thundering pulse": "громовой пульс",
  "engulfing lightning": "сияющая жатва",
  "everlasting moonglow": "вечная луна",
  "song of broken pines": "песнь разбитых сосен",
  "elegy for the end": "элегия погибели",
  "haran gekpaku futsu": "харан гэппаку фуцу",
  "redhorn": "краснорогий камнеруб",
  "kaguras verity": "истинное право кагура",
  "kagura's verity": "истинное право кагура",
  "calamity queller": "усмиритель бед",
  "aqua simulacra": "аква симулякрум",
  "light of foliar incision": "свет лиственного надреза",
  "key of khaj nisut": "ключ хадж-нисут",
  "key of khaj-nisut": "ключ хадж-нисут",
  "a thousand floating dreams": "тысяча парящих снов",
  "staff of the scarlet sands": "посох алых песков",
  "beacon of the reed sea": "маяк тростникового моря",
  "tulaytullahs remembrance": "воспоминания тулайтуллы",
  "tulaytullah's remembrance": "воспоминания тулайтуллы",
  "hunter's path": "путь охотника",
  "hunters path": "путь охотника",
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

/** EN / paimon_id → RU-ключ для поиска в каталоге */
export function localizeWishLookupKey(raw: string): string {
  const spaced = normalizeKey(raw.replace(/[_-]+/g, " "));
  return EN_TO_RU[spaced] || EN_TO_RU[normalizeKey(raw)] || spaced;
}

/** Красивое RU-имя для UI (даже если оружия ещё нет в вики). */
export function localizeWishDisplayName(raw: string): string {
  const spaced = normalizeKey(String(raw || "").replace(/[_-]+/g, " "));
  const mapped = EN_TO_RU[spaced] || EN_TO_RU[normalizeKey(raw)];
  if (!mapped) return String(raw || "").trim();
  return mapped
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * 4★, которых иногда ошибочно помечают как 5★ в каталоге / импорте.
 * Не должны попадать в «История 5★» и не должны сбрасывать гарант 5★.
 */
export const FORCE_FOUR_STAR_KEYS = new Set(
  [
    "ororon",
    "оророн",
    "iansan",
    "иансан",
    "chevreuse",
    "шеврез",
    "gaming",
    "га мин",
    "гамин",
    "sethos",
    "сетос",
    "kaveh",
    "кавех",
    "mika",
    "мика",
    "yaoyao",
    "яо яо",
    "yao yao",
    "layla",
    "лайла",
    "candace",
    "кандакия",
    "faruzan",
    "фарузан",
    "collei",
    "коллеи",
    "dori",
    "дори",
    "heizou",
    "хэйдзо",
    "shinobu",
    "синобу",
    "sara",
    "сара",
    "gorou",
    "горо",
    "thoma",
    "тома",
    "sayu",
    "саю",
    "yanfei",
    "янь фэй",
    "rosaria",
    "розария",
    "xinyan",
    "синь янь",
    "diona",
    "диона",
    "sucrose",
    "сахароза",
    "chongyun",
    "чунь юнь",
    "xingqiu",
    "син цю",
    "beidou",
    "бэй доу",
    "ningguang",
    "нин гуан",
    "xiangling",
    "сян лин",
    "fischl",
    "фишль",
    "bennett",
    "беннет",
    "razor",
    "рэйзор",
    "noelle",
    "ноэлль",
    "barbara",
    "барбара",
    "amber",
    "эмбер",
    "kaeya",
    "кэя",
    "lisa",
    "лиза",
  ].map((s) => normalizeKey(s).replace(/\s+/g, "")),
);

export function isForcedFourStarName(name: string): boolean {
  const k = normalizeKey(name).replace(/\s+/g, "");
  const localized = normalizeKey(localizeWishLookupKey(name)).replace(
    /\s+/g,
    "",
  );
  return FORCE_FOUR_STAR_KEYS.has(k) || FORCE_FOUR_STAR_KEYS.has(localized);
}

export type CatalogRankHit = {
  rarity: "LEGEND" | "EPIC" | "RARE" | "COMMON" | string;
  name: string;
  itemType: "Character" | "Weapon";
};

/** Индекс редкости по имени/алиасу для правки rankType перед подсчётом pity. */
export function buildCatalogRankIndex(input: {
  characters: { slug: string; name: string; rarity: string }[];
  weapons: { slug: string; name: string; rarity: string }[];
}): Map<string, CatalogRankHit> {
  const map = new Map<string, CatalogRankHit>();
  const put = (raw: string, hit: CatalogRankHit) => {
    for (const k of aliasKeys(raw)) {
      map.set(k, hit);
      map.set(k.replace(/\s+/g, ""), hit);
    }
  };

  for (const c of input.characters) {
    const hit: CatalogRankHit = {
      rarity: c.rarity,
      name: c.name,
      itemType: "Character",
    };
    put(c.name, hit);
    put(c.slug.replace(/-/g, " "), hit);
    if (isForcedFourStarName(c.name) || isForcedFourStarName(c.slug)) {
      hit.rarity = "EPIC";
    }
  }
  for (const w of input.weapons) {
    const hit: CatalogRankHit = {
      rarity: w.rarity,
      name: w.name,
      itemType: "Weapon",
    };
    put(w.name, hit);
    put(w.slug.replace(/-/g, " "), hit);
  }

  for (const [en, ru] of Object.entries(EN_TO_RU)) {
    const ruHit =
      map.get(normalizeKey(ru)) ||
      map.get(normalizeKey(ru).replace(/\s+/g, ""));
    if (ruHit) {
      map.set(normalizeKey(en), ruHit);
      map.set(normalizeKey(en).replace(/\s+/g, ""), ruHit);
    }
  }
  return map;
}

export function resolveCatalogRank(
  itemName: string,
  itemType: string,
  index: Map<string, CatalogRankHit>,
): CatalogRankHit | null {
  for (const k of aliasKeys(itemName)) {
    const hit = index.get(k) || index.get(k.replace(/\s+/g, ""));
    if (hit) return hit;
  }
  if (isForcedFourStarName(itemName)) {
    return {
      rarity: "EPIC",
      name: localizeWishDisplayName(itemName),
      itemType: /weapon|оруж/i.test(itemType) ? "Weapon" : "Character",
    };
  }
  return null;
}

/** Правит rankType/имя по каталогу (Оророн 4★, EN→RU и т.д.). */
export function applyCatalogRanksToPulls<
  T extends {
    itemName: string;
    itemType: string;
    rankType: string;
  },
>(pulls: T[], index: Map<string, CatalogRankHit>): T[] {
  return pulls.map((p) => {
    const hit = resolveCatalogRank(p.itemName, p.itemType, index);
    if (!hit) {
      if (isForcedFourStarName(p.itemName) && String(p.rankType) === "5") {
        return {
          ...p,
          rankType: "4",
          itemName: localizeWishDisplayName(p.itemName),
        };
      }
      // EN оружие без карточки в вики — хотя бы русское имя
      if (/weapon|оруж/i.test(p.itemType)) {
        const localized = localizeWishDisplayName(p.itemName);
        if (localized !== p.itemName) return { ...p, itemName: localized };
      }
      return p;
    }

    let rankType = p.rankType;
    if (hit.rarity === "LEGEND") rankType = "5";
    else if (hit.rarity === "EPIC") rankType = "4";
    else if (hit.rarity === "RARE" || hit.rarity === "COMMON") rankType = "3";

    return {
      ...p,
      itemName: hit.name,
      itemType: hit.itemType,
      rankType,
    };
  });
}

export function wishEnToRuEntries(): [string, string][] {
  return Object.entries(EN_TO_RU);
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

  // EN / paimon-ключи → уже найденные RU-записи
  for (const [en, ru] of Object.entries(EN_TO_RU)) {
    const ruKey = normalizeKey(ru);
    const charHit =
      charactersByKey.get(ruKey) ||
      charactersByKey.get(ruKey.replace(/\s+/g, ""));
    if (charHit) {
      charactersByKey.set(normalizeKey(en), charHit);
      charactersByKey.set(normalizeKey(en).replace(/\s+/g, ""), charHit);
    }
    const weaponHit =
      weaponsByKey.get(ruKey) || weaponsByKey.get(ruKey.replace(/\s+/g, ""));
    if (weaponHit) {
      weaponsByKey.set(normalizeKey(en), weaponHit);
      weaponsByKey.set(normalizeKey(en).replace(/\s+/g, ""), weaponHit);
    }
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
): { href: string; image: string | null; slug: string; name: string } | null {
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
          name: hit.name,
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
