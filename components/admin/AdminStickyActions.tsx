import type { ReactNode } from "react";

/** Кнопки действий, фиксированные справа при прокрутке. */
export default function AdminStickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-3 z-40 flex flex-col items-stretch gap-2 sm:bottom-8 sm:right-5">
      <div className="pointer-events-auto flex min-w-[200px] flex-col gap-2 rounded-[20px] border border-black/[0.06] bg-white/95 p-2.5 shadow-[0_16px_40px_-16px_rgba(11,31,68,0.45)] backdrop-blur-md sm:min-w-[240px]">
        {children}
      </div>
    </div>
  );
}
