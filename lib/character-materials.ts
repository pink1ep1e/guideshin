export type MaterialCategory =
  | "ascension"
  | "talent"
  | "boss"
  | "local"
  | "exp"
  | "consumable"
  | "other";

export type CharacterMaterial = {
  id: string;
  name: string;
  image: string;
  qty: number;
  category: MaterialCategory;
  rarityStars?: number;
};

export const MATERIAL_CATEGORY_LABEL: Record<MaterialCategory, string> = {
  local: "Диковинка",
  ascension: "Возвышение",
  talent: "Таланты",
  boss: "Босс",
  exp: "Опыт / мора",
  consumable: "Расходник",
  other: "Другое",
};

/** Порядок секций в каталоге материалов. */
export const MATERIAL_CATEGORY_ORDER: MaterialCategory[] = [
  "local",
  "ascension",
  "talent",
  "boss",
  "exp",
  "consumable",
  "other",
];

export type MaterialCategoryGroup<T> = {
  category: MaterialCategory;
  title: string;
  items: T[];
};

export function normalizeMaterialCategory(raw?: string | null): MaterialCategory {
  const key = String(raw ?? "other").trim().toLowerCase();
  return (MATERIAL_CATEGORY_ORDER as string[]).includes(key)
    ? (key as MaterialCategory)
    : "other";
}

export function groupByMaterialCategory<T>(
  items: T[],
  getCategory: (item: T) => string | null | undefined,
): MaterialCategoryGroup<T>[] {
  const map = new Map<MaterialCategory, T[]>();
  for (const item of items) {
    const category = normalizeMaterialCategory(getCategory(item));
    const list = map.get(category) ?? [];
    list.push(item);
    map.set(category, list);
  }
  const groups: MaterialCategoryGroup<T>[] = [];
  for (const category of MATERIAL_CATEGORY_ORDER) {
    const list = map.get(category);
    if (list?.length) {
      groups.push({
        category,
        title: MATERIAL_CATEGORY_LABEL[category],
        items: list,
      });
    }
  }
  return groups;
}

export function parseMaterials(raw: unknown): CharacterMaterial[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? "").trim();
      const image = String(row.image ?? "").trim();
      const qty = Number(row.qty);
      if (!name || !Number.isFinite(qty)) return null;
      const category = (String(row.category ?? "other") as MaterialCategory);
      const allowed: MaterialCategory[] = [
        "ascension",
        "talent",
        "boss",
        "local",
        "exp",
        "consumable",
        "other",
      ];
      return {
        id: String(row.id ?? `${name}-${qty}`),
        name,
        image,
        qty: Math.max(0, Math.round(qty)),
        category: allowed.includes(category) ? category : "other",
        rarityStars: Number.isFinite(Number(row.rarityStars))
          ? Math.min(5, Math.max(1, Number(row.rarityStars)))
          : 3,
      } satisfies CharacterMaterial;
    })
    .filter(Boolean) as CharacterMaterial[];
}

export function materialUid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
