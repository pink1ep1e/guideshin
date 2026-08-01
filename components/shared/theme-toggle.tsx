"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9 rounded-full border border-border" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Переключить тему"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary/60 text-foreground transition hover:bg-secondary hover:text-primary"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
