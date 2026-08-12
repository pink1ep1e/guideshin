"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type FancySelectOption = {
  value: string;
  label: string;
  icon?: string;
};

type FancySelectProps = {
  label?: string;
  value: string;
  options: FancySelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
};

type MenuPos = { top: number; left: number; width: number; maxHeight: number; openUp: boolean };

export default function FancySelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Выберите…",
  className = "",
  size = "md",
}: FancySelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<MenuPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  function updatePosition() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const preferredMax = 240;
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(preferredMax, Math.max(120, openUp ? spaceAbove : spaceBelow));
    setPos({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUp,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    function onScrollOrResize() {
      updatePosition();
    }
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pad = size === "sm" ? "px-3 py-2 text-sm" : "px-3.5 py-2.5 text-sm";

  const menu =
    open && mounted && pos
      ? createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            style={{
              position: "fixed",
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
              zIndex: 9999,
              ...(pos.openUp
                ? { bottom: window.innerHeight - pos.top, top: "auto" }
                : { top: pos.top }),
            }}
            className="overflow-auto gs-scrollbar rounded-[16px] border border-black/[0.06] bg-white p-1.5 shadow-panel"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value || "__empty"} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#189b8e] text-white"
                        : "text-foreground hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
                    }`}
                  >
                    {opt.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.icon}
                        alt=""
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </p>
      )}
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-[14px] border border-black/[0.08] bg-card ${pad} font-semibold text-foreground shadow-sm outline-none transition hover:border-[#189b8e]/40 focus:ring-2 focus:ring-[#189b8e]/25 dark:border-white/10 dark:bg-white/[0.04] ${
          open ? "border-[#189b8e]/50 ring-2 ring-[#189b8e]/20" : ""
        }`}
      >
        {selected?.icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.icon} alt="" className="h-5 w-5 shrink-0 object-contain" />
        )}
        <span className={`min-w-0 flex-1 truncate text-left ${selected ? "" : "text-muted-foreground"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#189b8e] transition ${open ? "rotate-180" : ""}`}
        />
      </button>
      {menu}
    </div>
  );
}
