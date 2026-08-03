"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type AdminNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

/** Кнопки действий, фиксированные справа при прокрутке. */
export default function AdminStickyActions({
  children,
  nav = [],
}: {
  children: ReactNode;
  /** Быстрый переход к заполненным разделам формы */
  nav?: AdminNavItem[];
}) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-3 z-40 flex flex-col items-stretch gap-2 sm:bottom-8 sm:right-5">
      <div className="pointer-events-auto flex min-w-[200px] flex-col gap-2 rounded-[20px] border border-black/[0.06] bg-white/95 p-2.5 shadow-[0_16px_40px_-16px_rgba(11,31,68,0.45)] backdrop-blur-md sm:min-w-[240px]">
        {nav.length > 0 && (
          <div className="rounded-[14px] bg-[#0b1f44]/[0.03] p-2">
            <p className="mb-1.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              Разделы
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => scrollTo(item.id)}
                    className="group flex flex-col items-center gap-1 rounded-[12px] bg-white px-1 py-2 ring-1 ring-black/[0.06] transition hover:ring-[#189b8e]/40 hover:shadow-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#189b8e]/10 text-[#189b8e] transition group-hover:bg-[#189b8e] group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="max-w-full truncate text-[9px] font-bold leading-tight text-foreground/70">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
