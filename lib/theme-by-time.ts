/** Local daytime hours (inclusive start, exclusive end). */
export const DAY_THEME_START_HOUR = 7;
export const DAY_THEME_END_HOUR = 19;

export type ThemePreference = "light" | "dark" | "auto";

export function getThemeByTime(date = new Date()): "light" | "dark" {
  const hour = date.getHours();
  return hour >= DAY_THEME_START_HOUR && hour < DAY_THEME_END_HOUR
    ? "light"
    : "dark";
}

export function resolveThemePreference(
  preference: ThemePreference | string | null | undefined,
  date = new Date(),
): "light" | "dark" {
  if (preference === "light" || preference === "dark") return preference;
  return getThemeByTime(date);
}

export const THEME_MODE_STORAGE_KEY = "theme-mode";
