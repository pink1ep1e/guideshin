"use client";

import { useEffect, useState } from "react";
import { ELEMENT_SVG } from "@/lib/genshin";

const STORAGE_KEY = "guideshin-boot-loader";

const ELEMENTS = [
  "PYRO",
  "HYDRO",
  "ANEMO",
  "ELECTRO",
  "DENDRO",
  "CRYO",
  "GEO",
] as const;

/** Резко 10% → резко 35% → плавно быстро до 80% → резко 99% */
const HOLD_10_MS = 100;
const HOLD_35_MS = 110;
const SMOOTH_TO_80_MS = 520;
const HOLD_99_MS = 340;
const FADE_MS = 420;

function progressAt(elapsed: number): number | "done" {
  if (elapsed < HOLD_10_MS) return 10;

  const after35 = HOLD_10_MS + HOLD_35_MS;
  if (elapsed < after35) return 35;

  const smoothEnd = after35 + SMOOTH_TO_80_MS;
  if (elapsed < smoothEnd) {
    const t = (elapsed - after35) / SMOOTH_TO_80_MS;
    const eased = 1 - (1 - t) ** 3;
    return 35 + (80 - 35) * eased;
  }

  if (elapsed < smoothEnd + HOLD_99_MS) return 99;
  return "done";
}

function iconsFromProgress(progress: number) {
  const per = 100 / ELEMENTS.length;
  const exact = progress / per;
  const active = Math.min(ELEMENTS.length - 1, Math.floor(exact));
  const fill = Math.min(100, Math.max(0, (exact - active) * 100));
  return { active, fill };
}

export default function SiteLoader() {
  const [phase, setPhase] = useState<"boot" | "run" | "out" | "done">("boot");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        document.documentElement.classList.remove("gs-loading");
        setPhase("done");
        return;
      }
    } catch {
      /* ignore */
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      document.documentElement.classList.remove("gs-loading");
      setPhase("done");
      return;
    }

    setPhase("run");
  }, []);

  useEffect(() => {
    if (phase !== "run") return;

    let cancelled = false;
    let raf = 0;
    let start = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      if (!start) start = now;
      const elapsed = now - start;
      const next = progressAt(elapsed);

      if (next === "done") {
        setProgress(99);
        setPhase("out");
        return;
      }

      setProgress(next);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      document.documentElement.classList.remove("gs-loading");
      setPhase("done");
    }, FADE_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") {
      document.documentElement.classList.remove("gs-loading");
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "done" || phase === "boot") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "done" || phase === "boot") return null;

  const { active, fill } = iconsFromProgress(progress);

  return (
    <div
      className={`site-loader fixed inset-0 z-[200] flex items-center justify-center bg-background ${
        phase === "out" ? "site-loader--out" : ""
      }`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">Загрузка Guideshin {Math.round(progress)}%</span>
      <div className="flex items-center gap-5 sm:gap-7 md:gap-8">
        {ELEMENTS.map((key, i) => {
          const src = ELEMENT_SVG[key];
          const width =
            i < active ? 100 : i === active ? fill : 0;

          return (
            <div
              key={key}
              className="relative h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem] md:h-20 md:w-20"
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="site-loader-glyph site-loader-glyph--ghost absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${width}%` }}
              >
                <div className="h-full w-14 sm:w-[4.5rem] md:w-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="site-loader-glyph site-loader-glyph--solid h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
