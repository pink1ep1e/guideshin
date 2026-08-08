"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { TelegramLink } from "@/components/TelegramLink";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/map", label: "Карта" },
  { href: "/wiki/characters", label: "Персонажи" },
  { href: "/wiki/artifacts", label: "Артефакты" },
  { href: "/wiki/weapons", label: "Оружие" },
];

const tierItems = [
  { href: "/wiki/characters", label: "Топ персонажей" },
  { href: "/wiki/weapons", label: "Топ оружия" },
  { href: "/wiki/artifacts", label: "Топ артефактов" },
];

const wikiItems = [
  { href: "/wiki/characters", label: "Персонажи" },
  { href: "/wiki/weapons", label: "Оружие" },
  { href: "/wiki/artifacts", label: "Артефакты" },
  { href: "/wiki/materials", label: "Материалы" },
  { href: "/wiki/regions", label: "Регионы" },
];

function isLinkActive(pathname: string, href: string) {
  if (href === "#" || !href) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Pill = { x: number; y: number; width: number; height: number };

function measurePill(container: HTMLElement, el: HTMLElement): Pill {
  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    x: r.left - c.left,
    y: r.top - c.top,
    width: r.width,
    height: r.height,
  };
}

function NavDropdown({
  label,
  items,
  buttonRef,
  onHover,
  onNavigate,
}: {
  label: string;
  items: { href: string; label: string }[];
  buttonRef: (el: HTMLButtonElement | null) => void;
  onHover: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="group relative hidden lg:block">
      <button
        type="button"
        ref={buttonRef}
        onMouseEnter={onHover}
        className="relative z-10 inline-flex items-center gap-1 rounded-[14px] px-3 py-3 text-[15.5px] font-semibold text-foreground transition-colors duration-200 hover:text-[#189b8e]"
      >
        {label}
        <ChevronDown className="h-4 w-4 text-[#189b8e]/80 transition duration-200 group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-30 min-w-[240px] pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100">
        <div className="origin-top rounded-[18px] border border-black/[0.06] bg-white/95 p-2 shadow-panel backdrop-blur-md">
          <div className="mb-1 px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#189b8e]/80">
            {label}
          </div>
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-[#189b8e]/12 hover:text-[#189b8e]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#189b8e]/50" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileAccordion({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: { href: string; label: string }[];
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[14px]">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-[15.5px] font-semibold text-foreground"
        aria-expanded={expanded}
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 text-[#189b8e] transition duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="mb-1 space-y-0.5 px-1 pb-1">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/80 transition hover:bg-[#189b8e]/12 hover:text-[#189b8e]"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#189b8e]/50" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SlidingPill({
  pill,
  visible,
  className,
}: {
  pill: Pill;
  visible: boolean;
  className: string;
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute left-0 top-0 rounded-[14px] transition-all duration-300 ease-out ${className}`}
      style={{
        transform: `translate(${pill.x}px, ${pill.y}px)`,
        width: pill.width,
        height: pill.height,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const [hoverPill, setHoverPill] = useState<Pill>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [hoverVisible, setHoverVisible] = useState(false);
  const [activePill, setActivePill] = useState<Pill>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [activeVisible, setActiveVisible] = useState(false);

  const closeMenu = useCallback(() => setOpen(false), []);

  const setItemRef = useCallback((index: number, el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  const updateActivePill = useCallback(() => {
    const container = navRef.current;
    if (!container) return;

    const activeIndex = navLinks.findIndex((link) =>
      isLinkActive(pathname, link.href),
    );
    const activeEl = activeIndex >= 0 ? itemRefs.current[activeIndex] : null;

    if (!activeEl) {
      setActiveVisible(false);
      return;
    }

    setActivePill(measurePill(container, activeEl));
    setActiveVisible(true);
  }, [pathname]);

  const moveHoverTo = useCallback((index: number) => {
    const container = navRef.current;
    const el = itemRefs.current[index];
    if (!container || !el) return;
    setHoverPill(measurePill(container, el));
    setHoverVisible(true);
  }, []);

  useLayoutEffect(() => {
    updateActivePill();
    window.addEventListener("resize", updateActivePill);
    return () => window.removeEventListener("resize", updateActivePill);
  }, [updateActivePill, open]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  const dropdownStart = navLinks.length;
  const isMap = pathname === "/map";

  return (
    <div
      className={`flex items-center justify-center px-3 pt-5 sm:px-4 ${
        isMap ? "pointer-events-none fixed inset-x-0 top-0 z-[60]" : "relative z-50 shrink-0"
      }`}
    >
      <header
        className={`glass-panel pointer-events-auto relative z-50 w-full max-w-[1100px] ${
          isMap ? "shadow-[0_12px_40px_-12px_rgba(11,31,68,0.45)]" : ""
        }`}
      >
        <div className="flex min-h-[64px] items-center justify-between gap-3 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-3">
          <Link
            href="/"
            className="relative z-10 flex shrink-0 items-center"
            aria-label="Guideshin — на главную"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="Guideshin"
              width={56}
              height={58}
              className="h-11 w-auto object-contain sm:h-12"
              decoding="async"
            />
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Меню"
          >
            {open ? "Закрыть" : "Меню"}
          </button>

          <nav
            className={`${
              open ? "flex" : "hidden"
            } absolute left-0 right-0 top-full z-50 mt-2 flex-col gap-3 rounded-[20px] border border-black/[0.06] bg-white p-3 shadow-panel lg:static lg:mt-0 lg:grid lg:flex-1 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}
          >
            <div
              ref={navRef}
              className="relative flex flex-col gap-0.5 rounded-[16px] bg-[#189b8e]/[0.08] p-1 lg:justify-self-center lg:flex-row lg:items-center lg:gap-1"
              onMouseLeave={() => setHoverVisible(false)}
            >
              <SlidingPill
                pill={hoverPill}
                visible={hoverVisible}
                className="z-0 hidden bg-[#189b8e25] lg:block"
              />
              <SlidingPill
                pill={activePill}
                visible={activeVisible}
                className="z-[1] bg-[#189b8e]"
              />

              {navLinks.map((link, index) => {
                const active = isLinkActive(pathname, link.href);
                return (
                  <Link
                    key={link.label}
                    ref={(el) => setItemRef(index, el)}
                    href={link.href}
                    onMouseEnter={() => moveHoverTo(index)}
                    className={`relative z-10 rounded-[14px] px-3 py-3 text-[15.5px] font-semibold transition-colors duration-200 ${
                      active
                        ? "text-white"
                        : "text-foreground hover:text-[#189b8e]"
                    }`}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </Link>
                );
              })}

              <div className="lg:hidden">
                <MobileAccordion
                  label="Тир листы"
                  items={tierItems}
                  onNavigate={closeMenu}
                />
                <MobileAccordion
                  label="Wiki"
                  items={wikiItems}
                  onNavigate={closeMenu}
                />
              </div>

              <NavDropdown
                label="Тир листы"
                items={tierItems}
                buttonRef={(el) => setItemRef(dropdownStart, el)}
                onHover={() => moveHoverTo(dropdownStart)}
                onNavigate={closeMenu}
              />
              <NavDropdown
                label="Wiki"
                items={wikiItems}
                buttonRef={(el) => setItemRef(dropdownStart + 1, el)}
                onHover={() => moveHoverTo(dropdownStart + 1)}
                onNavigate={closeMenu}
              />
            </div>

            <div className="flex items-center gap-2 lg:justify-self-end">
              <TelegramLink
                placement="navbar"
                showLabel={false}
                className="ui-btn-secondary h-auto px-4 py-3.5 lg:px-5"
              />
              <button
                type="button"
                className="ui-btn-primary h-auto flex-1 px-5 py-3.5 text-[15px] lg:flex-none"
                onClick={() => {
                  closeMenu();
                  router.push("/wiki/characters");
                }}
              >
                Смотреть гайды
              </button>
            </div>
          </nav>
        </div>
      </header>
    </div>
  );
}
