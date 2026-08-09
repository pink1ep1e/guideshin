import type { WishPullLike } from "@/lib/wishes";
import {
  GACHA_TYPES,
  dedupeWishPulls,
  gachaTypesForBanner,
} from "@/lib/wishes";

/** Стандартные 5★ персонажи (проигрыш 50:50 на ивенте). */
export const STANDARD_5_STAR_KEYS = new Set(
  [
    "джинн",
    "jean",
    "ци ци",
    "цици",
    "qiqi",
    "мона",
    "mona",
    "дилюк",
    "diluc",
    "кэ цин",
    "кэцин",
    "keqing",
    "тигнари",
    "tighnari",
    "дэхья",
    "дехья",
    "dehya",
    "мидзуки",
    "yumemizuki mizuki",
    "mizuki",
  ].map((s) => s.toLowerCase().replace(/\s+/g, "")),
);

function normName(name: string) {
  return name.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, "");
}

export function isStandardFiveStar(name: string): boolean {
  return STANDARD_5_STAR_KEYS.has(normName(name));
}

export type FiftyFiftyStats = {
  wins: number;
  losses: number;
  /** % выигранных 50:50 */
  winRate: number;
  total: number;
};

/** 50:50 только по ивенту персонажей (5★). */
export function computeFiftyFifty(pulls: WishPullLike[]): FiftyFiftyStats {
  const types = gachaTypesForBanner("character");
  const chron = dedupeWishPulls(pulls)
    .filter(
      (p) =>
        types.includes(p.gachaType) && String(p.rankType) === "5",
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(a.wishTime).getTime() - new Date(b.wishTime).getTime(),
    );

  let wins = 0;
  let losses = 0;
  let guaranteed = false;

  for (const pull of chron) {
    const paimonRate = pull.raw?.paimon_rate;

    if (typeof paimonRate === "number") {
      // 0 = проигрыш, 1 = выигрыш 50:50, 2 = гарант (не считаем в 50:50)
      if (paimonRate === 0) losses += 1;
      else if (paimonRate === 1) wins += 1;
      continue;
    }

    if (guaranteed) {
      guaranteed = false;
      continue;
    }
    if (isStandardFiveStar(pull.itemName)) {
      losses += 1;
      guaranteed = true;
    } else {
      wins += 1;
    }
  }

  const total = wins + losses;
  return {
    wins,
    losses,
    total,
    winRate: total ? (wins / total) * 100 : 0,
  };
}

export type AccountLuckSnapshot = {
  accountId: string;
  total: number;
  rate5: number;
  rate4: number;
  avgGarant5: number | null;
  fiftyWinRate: number | null;
};

export type CommunityLuck = {
  sampleSize: number;
  your: {
    total: number;
    rate5: number;
    rate4: number;
    avgGarant5: number | null;
    fifty: FiftyFiftyStats;
  };
  community: {
    avgTotal: number;
    avgRate5: number;
    avgRate4: number;
    avgGarant5: number | null;
    avgFiftyWinRate: number | null;
  };
  /** На сколько % пользователей вы удачливее по каждому метрику */
  betterThan: {
    rate5: number | null;
    rate4: number | null;
    garant5: number | null;
    fifty: number | null;
    total: number | null;
  };
  verdict: string;
};

function percentileBetter(
  yours: number,
  others: number[],
  higherIsBetter: boolean,
): number | null {
  if (!others.length) return null;
  const better = others.filter((v) =>
    higherIsBetter ? yours > v : yours < v,
  ).length;
  return Math.round((better / others.length) * 100);
}

export function buildCommunityLuck(
  yours: {
    total: number;
    rate5: number;
    rate4: number;
    avgGarant5: number | null;
    fifty: FiftyFiftyStats;
  },
  peers: AccountLuckSnapshot[],
): CommunityLuck {
  const usable = peers.filter((p) => p.total >= 40);
  const sampleSize = usable.length;

  const rates5 = usable.map((p) => p.rate5);
  const rates4 = usable.map((p) => p.rate4);
  const totals = usable.map((p) => p.total);
  const garants = usable
    .map((p) => p.avgGarant5)
    .filter((v): v is number => v != null);
  const fifties = usable
    .map((p) => p.fiftyWinRate)
    .filter((v): v is number => v != null);

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const betterThan = {
    rate5: percentileBetter(yours.rate5, rates5, true),
    rate4: percentileBetter(yours.rate4, rates4, true),
    garant5:
      yours.avgGarant5 == null
        ? null
        : percentileBetter(yours.avgGarant5, garants, false),
    fifty:
      yours.fifty.total < 2
        ? null
        : percentileBetter(yours.fifty.winRate, fifties, true),
    total: percentileBetter(yours.total, totals, true),
  };

  const scores = [
    betterThan.rate5,
    betterThan.garant5,
    betterThan.fifty,
  ].filter((v): v is number => v != null);
  const meanScore = scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;

  let verdict =
    sampleSize < 2
      ? "Пока мало других игроков для сравнения — блок заполнится по мере роста сообщества."
      : "Ваша удача около среднего уровня сообщества.";
  if (meanScore != null) {
    if (meanScore >= 70) {
      verdict = "Вы заметно удачливее большинства игроков Guideshin.";
    } else if (meanScore >= 40) {
      verdict = "Ваша удача около среднего уровня сообщества.";
    } else {
      verdict = "Сообщество в среднем выбивает 5★ удачнее вас — пока.";
    }
  }

  return {
    sampleSize,
    your: yours,
    community: {
      avgTotal: Number(avg(totals).toFixed(0)),
      avgRate5: Number(avg(rates5).toFixed(2)),
      avgRate4: Number(avg(rates4).toFixed(2)),
      avgGarant5: garants.length ? Number(avg(garants).toFixed(1)) : null,
      avgFiftyWinRate: fifties.length
        ? Number(avg(fifties).toFixed(1))
        : null,
    },
    betterThan,
    verdict,
  };
}

export function snapshotFromPulls(
  accountId: string,
  pulls: WishPullLike[],
): AccountLuckSnapshot {
  const unique = dedupeWishPulls(pulls);
  const total = unique.length;
  const count5 = unique.filter((p) => String(p.rankType) === "5").length;
  const count4 = unique.filter((p) => String(p.rankType) === "4").length;
  const fifty = computeFiftyFifty(unique);

  // средний гарант ≈ total/count5 как грубая оценка для сообщества
  const eventTypes = [
    ...gachaTypesForBanner("character"),
    GACHA_TYPES.weapon,
    GACHA_TYPES.permanent,
    GACHA_TYPES.chronicled,
  ];
  const eventPulls = unique.filter((p) => eventTypes.includes(p.gachaType));
  const event5 = eventPulls.filter((p) => String(p.rankType) === "5").length;

  return {
    accountId,
    total,
    rate5: total ? (count5 / total) * 100 : 0,
    rate4: total ? (count4 / total) * 100 : 0,
    avgGarant5: event5 ? eventPulls.length / event5 : null,
    fiftyWinRate: fifty.total >= 2 ? fifty.winRate : null,
  };
}
