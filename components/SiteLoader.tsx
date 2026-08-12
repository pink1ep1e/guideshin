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

const FILL_MS = 320;
const GAP_MS = 40;
const HOLD_MS = 280;
const FADE_MS = 420;

export default function SiteLoader() {
  const [phase, setPhase] = useState<"boot" | "run" | "out" | "done">("boot");
  const [active, setActive] = useState(0);
  const [fill, setFill] = useState(0);

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
      const cycle = FILL_MS + GAP_MS;
      const idx = Math.min(
        ELEMENTS.length - 1,
        Math.floor(elapsed / cycle),
      );
      const local = elapsed - idx * cycle;
      const pct =
        idx < ELEMENTS.length - 1 || local < FILL_MS
          ? Math.min(100, (Math.min(local, FILL_MS) / FILL_MS) * 100)
          : 100;

      setActive(idx);
      setFill(pct);

      const totalFill = ELEMENTS.length * cycle - GAP_MS;
      if (elapsed < totalFill + HOLD_MS) {
        raf = requestAnimationFrame(tick);
        return;
      }

      setActive(ELEMENTS.length - 1);
      setFill(100);
      setPhase("out");
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

  if (phase === "done") return null;

  // Keep mount during boot so hydrate is ready; hide until run/out
  if (phase === "boot") return null;

  return (
    <div
      className={`site-loader fixed inset-0 z-[200] flex items-center justify-center bg-background ${
        phase === "out" ? "site-loader--out" : ""
      }`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">Загрузка Guideshin</span>
      <div className="flex items-center gap-3 sm:gap-4">
        {ELEMENTS.map((key, i) => {
          const src = ELEMENT_SVG[key];
          const state =
            i < active ? "done" : i === active ? "active" : "pending";
          const width =
            state === "done" ? 100 : state === "active" ? fill : 0;

          return (
            <div
              key={key}
              className="relative h-9 w-9 sm:h-11 sm:w-11"
              aria-hidden
            >
              {/* ghost */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="site-loader-glyph site-loader-glyph--ghost absolute inset-0 h-full w-full object-contain"
                draggable={false}
              />
              {/* fill */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden"
                style={{ width: `${width}%` }}
              >
                <div className="h-full w-9 sm:w-11">
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
