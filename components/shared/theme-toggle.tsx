"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={`h-[50px] w-[50px] shrink-0 rounded-[16px] border border-border bg-secondary/40 ${className}`}
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      className={`inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[16px] border border-black/[0.08] bg-white/80 text-[#189b8e] transition duration-300 hover:bg-[#189b8e]/10 dark:border-[rgb(236_229_216/0.22)] dark:bg-[hsl(var(--card)/0.9)] dark:text-[#ece5d8] dark:hover:bg-[rgb(236_229_216/0.12)] ${className}`}
    >
      {isDark ? <Sun className="h-5 w-5" strokeWidth={2.2} /> : <Moon className="h-5 w-5" strokeWidth={2.2} />}
    </button>
  );
}
