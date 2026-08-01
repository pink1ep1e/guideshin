/** Порядок регионов в каталогах. */
export const REGION_ORDER = [
  "Нод-края",
  "Натлана",
  "Фонтейна",
  "Сумеру",
  "Инадзумы",
  "Ли Юэ",
  "Мондштадта",
  "Снежной",
  "Другое",
] as const;

export type RegionName = (typeof REGION_ORDER)[number];

export const REGION_OPTIONS: RegionName[] = [...REGION_ORDER];

const REGION_ALIASES: Record<string, RegionName> = {
  "Нод-края": "Нод-края",
  "нод-край": "Нод-края",
  "nod-krai": "Нод-края",
  nodkrai: "Нод-края",
  натлан: "Натлана",
  фонтейн: "Фонтейна",
  сумеру: "Сумеру",
  инадзума: "Инадзумы",
  "ли юэ": "Ли Юэ",
  лиюэ: "Ли Юэ",
  мондштадт: "Мондштадта",
  снежная: "Снежной",
  другое: "Другое",
};

export function normalizeRegion(raw?: string | null): RegionName {
  if (!raw?.trim()) return "Другое";
  const key = raw.trim().toLowerCase();
  if (REGION_ALIASES[key]) return REGION_ALIASES[key];
  const exact = REGION_ORDER.find((r) => r.toLowerCase() === key);
  return exact ?? "Другое";
}

export function regionSectionTitle(
  kind: "characters" | "artifacts" | "materials",
  region: string,
): string {
  const r = normalizeRegion(region);
  if (kind === "characters") return `Персонажи из ${r}`;
  if (kind === "artifacts") return `Артефакты ${r}`;
  return `Материалы ${r}`;
}

/** Типы оружия и заголовки секций каталога. */
export const WEAPON_TYPE_ORDER = [
  "Меч",
  "Двуручник",
  "Копьё",
  "Лук",
  "Катализатор",
] as const;

export type WeaponTypeName = (typeof WEAPON_TYPE_ORDER)[number];

export const WEAPON_TYPE_SECTION_TITLE: Record<WeaponTypeName, string> = {
  Меч: "Мечи",
  Двуручник: "Двуручное оружие",
  Копьё: "Древковое оружие",
  Лук: "Луки",
  Катализатор: "Катализаторы",
};

export function weaponTypeSectionTitle(type: string): string {
  const key = WEAPON_TYPE_ORDER.find((t) => t === type);
  if (key) return WEAPON_TYPE_SECTION_TITLE[key];
  return type || "Другое";
}

export type RegionGroup<T> = { region: RegionName; items: T[] };

export function groupByRegion<T>(
  items: T[],
  getRegion: (item: T) => string | null | undefined,
): RegionGroup<T>[] {
  const map = new Map<RegionName, T[]>();
  for (const item of items) {
    const region = normalizeRegion(getRegion(item));
    const list = map.get(region) ?? [];
    list.push(item);
    map.set(region, list);
  }
  const groups: RegionGroup<T>[] = [];
  for (const region of REGION_ORDER) {
    const list = map.get(region);
    if (list?.length) groups.push({ region, items: list });
  }
  return groups;
}

export type TypeGroup<T> = { type: string; title: string; items: T[] };

export function groupByWeaponType<T>(
  items: T[],
  getType: (item: T) => string,
): TypeGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const type = getType(item) || "Другое";
    const list = map.get(type) ?? [];
    list.push(item);
    map.set(type, list);
  }
  const groups: TypeGroup<T>[] = [];
  for (const type of WEAPON_TYPE_ORDER) {
    const list = map.get(type);
    if (list?.length) {
      groups.push({
        type,
        title: WEAPON_TYPE_SECTION_TITLE[type],
        items: list,
      });
    }
  }
  for (const [type, list] of map) {
    if (
      !(WEAPON_TYPE_ORDER as readonly string[]).includes(type) &&
      list.length
    ) {
      groups.push({ type, title: type, items: list });
    }
  }
  return groups;
}
