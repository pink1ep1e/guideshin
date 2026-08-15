"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, SunMoon } from "lucide-react";
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

function writeThemeMode(mode: ThemePreference) {
  try {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("guideshin-theme-mode"));
}

const CYCLE: ThemePreference[] = ["auto", "light", "dark"];

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mode, setMode] = React.useState<ThemePreference>("auto");

  React.useEffect(() => {
    setMounted(true);
    setMode(readThemeMode());
  }, []);

  if (!mounted) {
    return (
      <div
        className={`h-[50px] w-[50px] shrink-0 rounded-[16px] border border-border bg-secondary/40 ${className}`}
        aria-hidden
      />
    );
  }

  const label =
    mode === "auto"
      ? "Авто-тема по времени"
      : mode === "light"
        ? "Светлая тема"
        : "Тёмная тема";

  const nextLabel =
    mode === "auto"
      ? "Включить светлую тему"
      : mode === "light"
        ? "Включить тёмную тему"
        : "Включить авто-тему по времени";

  return (
    <button
      type="button"
      onClick={() => {
        const next = CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length]!;
        writeThemeMode(next);
        setMode(next);
        setTheme(next === "auto" ? getThemeByTime() : next);
      }}
      aria-label={nextLabel}
      title={label}
      className={`inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[16px] border border-black/[0.08] bg-white/80 text-[#189b8e] transition duration-300 hover:bg-[#189b8e]/10 dark:border-[rgb(236_229_216/0.22)] dark:bg-[hsl(var(--card)/0.9)] dark:text-[#ece5d8] dark:hover:bg-[rgb(236_229_216/0.12)] ${className}`}
    >
      {mode === "auto" ? (
        <SunMoon className="h-5 w-5" strokeWidth={2.2} />
      ) : mode === "dark" ? (
        <Moon className="h-5 w-5" strokeWidth={2.2} />
      ) : (
        <Sun className="h-5 w-5" strokeWidth={2.2} />
      )}
    </button>
  );
}
