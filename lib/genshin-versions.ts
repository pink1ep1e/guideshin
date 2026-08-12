/** Релизы версий Genshin Impact (дата старта патча, UTC). */
export type GenshinVersion = {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  start: string;
};

/** От новых к старым не обязательно — сортируем при поиске. */
export const GENSHIN_VERSIONS: GenshinVersion[] = [
  { id: "1.0", name: "Welcome to Teyvat", start: "2020-09-28" },
  { id: "1.1", name: "A New Star Approaches", start: "2020-11-11" },
  { id: "1.2", name: "The Chalk Prince and the Dragon", start: "2020-12-23" },
  { id: "1.3", name: "All That Glitters", start: "2021-02-03" },
  { id: "1.4", name: "Invitation of Windblume", start: "2021-03-17" },
  { id: "1.5", name: "Beneath the Surface", start: "2021-04-28" },
  { id: "1.6", name: "Midsummer Island Adventure", start: "2021-06-09" },
  { id: "2.0", name: "The Immovable God and the Eternal Euthymia", start: "2021-07-21" },
  { id: "2.1", name: "Floating World Under the Moonlight", start: "2021-09-01" },
  { id: "2.2", name: "Into the Perilous Labyrinth of Fog", start: "2021-10-13" },
  { id: "2.3", name: "Shadows Amidst Snowstorms", start: "2021-11-24" },
  { id: "2.4", name: "Fleeting Colors in Flight", start: "2022-01-05" },
  { id: "2.5", name: "When the Sakura Bloom", start: "2022-02-16" },
  { id: "2.6", name: "Zephyr of the Violet Garden", start: "2022-03-30" },
  { id: "2.7", name: "Hidden Dreams in the Depths", start: "2022-05-31" },
  { id: "2.8", name: "Summer Fantasia", start: "2022-07-13" },
  { id: "3.0", name: "The Morn a Thousand Roses Brings", start: "2022-08-24" },
  { id: "3.1", name: "The Wilderness Beyond Time", start: "2022-09-28" },
  { id: "3.2", name: "Akasha Pulses, the Kalpa Flame Rises", start: "2022-11-02" },
  { id: "3.3", name: "All Senses Clear, All Existence Void", start: "2022-12-07" },
  { id: "3.4", name: "The Exquisite Night Chimes", start: "2023-01-18" },
  { id: "3.5", name: "Windblume's Breath", start: "2023-03-01" },
  { id: "3.6", name: "A Parade of Providence", start: "2023-04-12" },
  { id: "3.7", name: "Duel! The Summoners' Summit!", start: "2023-05-24" },
  { id: "3.8", name: "Secret Summer Paradise", start: "2023-07-05" },
  { id: "4.0", name: "As Light Rain Falls Without Reason", start: "2023-08-16" },
  { id: "4.1", name: "To the Stars Shining in the Depths", start: "2023-09-27" },
  { id: "4.2", name: "Masquerade of the Guilty", start: "2023-11-08" },
  { id: "4.3", name: "Roses and Muskets", start: "2023-12-20" },
  { id: "4.4", name: "Vibrant Harriers Aloft in Spring Breeze", start: "2024-01-31" },
  { id: "4.5", name: "Blades Weaving Betwixt Brocade", start: "2024-03-13" },
  { id: "4.6", name: "Two Worlds Aflame, the Crimson Night Fades", start: "2024-04-24" },
  { id: "4.7", name: "An Everlasting Dream Intertwined", start: "2024-06-05" },
  { id: "4.8", name: "Summertide Scales and Tales", start: "2024-07-17" },
  { id: "5.0", name: "Flowers Resplendent on the Sun-Scorched Sojourn", start: "2024-08-28" },
  { id: "5.1", name: "The Rainbow Destined to Burn", start: "2024-10-09" },
  { id: "5.2", name: "Tapestry of Spirit and Flame", start: "2024-11-20" },
  { id: "5.3", name: "Incandescent Ode of Resurrection", start: "2025-01-01" },
  { id: "5.4", name: "Moonlight Amidst Dreams", start: "2025-02-12" },
  { id: "5.5", name: "Day of the Flames Return", start: "2025-03-26" },
  { id: "5.6", name: "Paralogism", start: "2025-05-07" },
  { id: "5.7", name: "A Space and Time for You", start: "2025-06-18" },
  { id: "5.8", name: "Sunspray Summer Resort", start: "2025-07-30" },
  { id: "6.0", name: "A Dance of Snowy Tides and Hoarfrost Groves", start: "2025-09-10" },
  { id: "6.1", name: "An Elegy for Faded Moonlight", start: "2025-10-22" },
  { id: "6.2", name: "A Nocturne of the Far North", start: "2025-12-03" },
  { id: "6.3", name: "A Traveler on a Winter's Night", start: "2026-01-14" },
  { id: "6.4", name: "Homeward, He Who Caught the Wind", start: "2026-02-25" },
  { id: "6.5", name: "Augured Homecoming", start: "2026-04-08" },
  { id: "6.6", name: "Truth Amongst the Pages of Purana", start: "2026-05-20" },
  { id: "6.7", name: "Sunny Summer Fontinalia", start: "2026-07-01" },
];

function parseDay(iso: string): number {
  return Date.parse(`${iso}T12:00:00Z`);
}

/** Версия, актуальная на указанную дату (середина месяца и т.п.). */
export function versionAtDate(date: Date): GenshinVersion | null {
  const t = date.getTime();
  if (Number.isNaN(t)) return null;
  let best: GenshinVersion | null = null;
  for (const v of GENSHIN_VERSIONS) {
    const start = parseDay(v.start);
    if (start <= t && (!best || start > parseDay(best.start))) best = v;
  }
  return best;
}

/** Версия на середину календарного месяца `YYYY-MM`. */
export function versionForMonthKey(monthKey: string): GenshinVersion | null {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return null;
  return versionAtDate(new Date(Date.UTC(y, m - 1, 15, 12)));
}

export function formatVersionLabel(v: GenshinVersion): string {
  return `v${v.id}`;
}

export function formatVersionStartRu(v: GenshinVersion): string {
  const d = new Date(`${v.start}T12:00:00Z`);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
