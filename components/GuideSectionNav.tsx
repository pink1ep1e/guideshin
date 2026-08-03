"use client";

import { useEffect, useState } from "react";
import type { GuideNavItem } from "@/lib/guide-builder";

type Props = {
  items: GuideNavItem[];
};

export default function GuideSectionNav({ items }: Props) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;

    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items]);

  if (!items.length) return null;

  function goTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Разделы гайда"
      className="sticky top-[4.5rem] z-30 -mx-1 mb-6 sm:top-[5rem]"
    >
      <div className="overflow-x-auto rounded-[16px] border border-black/[0.06] bg-white/90 px-2 py-2 shadow-soft backdrop-blur-md [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max min-w-full gap-1.5 px-1">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goTo(item.id)}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-[13px] transition ${
                    isActive
                      ? "bg-[#189b8e] font-semibold text-white shadow-sm"
                      : "font-medium text-foreground/70 hover:bg-[#0b1f44]/[0.04] hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
