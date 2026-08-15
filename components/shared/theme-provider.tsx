"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import {
  getThemeByTime,
  THEME_MODE_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme-by-time";

function readThemeMode(): ThemePreference {
  try {
    const mode = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (mode === "light" || mode === "dark" || mode === "auto") return mode;
  } catch {
    /* ignore */
  }
  return "auto";
}

function TimeBasedThemeSync() {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const apply = () => {
      const mode = readThemeMode();
      if (mode === "auto") {
        setTheme(getThemeByTime());
      } else {
        setTheme(mode);
      }
    };

    apply();

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === THEME_MODE_STORAGE_KEY ||
        event.key === "theme" ||
        event.key === null
      ) {
        apply();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("guideshin-theme-mode", apply);
    const intervalId = window.setInterval(apply, 60_000);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("guideshin-theme-mode", apply);
      window.clearInterval(intervalId);
    };
  }, [setTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <TimeBasedThemeSync />
      {children}
    </NextThemesProvider>
  );
}
