import type { GachaBannerKey } from "@/lib/wishes";

const GOALS_KEY = "guideshin-wish-goals-v1";
const AUTH_KEY = "guideshin-wish-auth-urls-v1";

export type BannerGoal = {
  banner: GachaBannerKey;
  targetName: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getBannerGoals(accountId: string): BannerGoal[] {
  const all = readJson<Record<string, BannerGoal[]>>(GOALS_KEY, {});
  return all[accountId] || [];
}

export function setBannerGoal(
  accountId: string,
  goal: BannerGoal | null,
  banner: GachaBannerKey,
) {
  const all = readJson<Record<string, BannerGoal[]>>(GOALS_KEY, {});
  const list = (all[accountId] || []).filter((g) => g.banner !== banner);
  if (goal?.targetName.trim()) {
    list.push({ banner, targetName: goal.targetName.trim() });
  }
  all[accountId] = list;
  writeJson(GOALS_KEY, all);
}

export function getSavedAuthUrl(accountId: string): string | null {
  const all = readJson<Record<string, string>>(AUTH_KEY, {});
  return all[accountId] || null;
}

export function setSavedAuthUrl(accountId: string, url: string | null) {
  const all = readJson<Record<string, string>>(AUTH_KEY, {});
  if (!url) delete all[accountId];
  else all[accountId] = url;
  writeJson(AUTH_KEY, all);
}

/** Примогемы / пачки до жёсткого гаранта. */
export function costToHardPity(remaining5: number) {
  const pulls = Math.max(0, remaining5);
  return {
    pulls,
    primogems: pulls * 160,
    packs: Math.ceil(pulls / 10),
    softHint: pulls,
  };
}
