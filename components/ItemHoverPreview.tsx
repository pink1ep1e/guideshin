"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { rarityBg } from "@/lib/genshin";

type PreviewState = {
  x: number;
  y: number;
  visible: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Красивое всплывающее превью при наведении на карточку. */
export default function ItemHoverPreview({
  name,
  image,
  lore,
  rarityStars = 4,
  fit = "contain",
  children,
  className = "",
}: {
  name: string;
  image: string;
  lore?: string | null;
  rarityStars?: number;
  fit?: "cover" | "contain";
  children: ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PreviewState>({ x: 0, y: 0, visible: false });
  const [shown, setShown] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tipId = useId();
  const stars = Math.min(5, Math.max(1, Math.round(rarityStars || 1)));
  const loreText = lore?.trim() || "";

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (showTimer.current) clearTimeout(showTimer.current);
    };
  }, []);

  const place = useCallback((clientX: number, clientY: number) => {
    const pad = 12;
    const tipW = 300;
    const tipH = 118;
    const x = clamp(clientX + 14, pad, window.innerWidth - tipW - pad);
    const y = clamp(clientY + 14, pad, window.innerHeight - tipH - pad);
    setState({ x, y, visible: true });
  }, []);

  function onEnter(e: React.MouseEvent) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    place(e.clientX, e.clientY);
    if (showTimer.current) clearTimeout(showTimer.current);
    showTimer.current = setTimeout(() => setShown(true), 40);
  }

  function onMove(e: React.MouseEvent) {
    if (!state.visible && !shown) return;
    place(e.clientX, e.clientY);
  }

  function onLeave() {
    if (showTimer.current) clearTimeout(showTimer.current);
    setShown(false);
    hideTimer.current = setTimeout(() => {
      setState((s) => ({ ...s, visible: false }));
    }, 180);
  }

  const tip =
    mounted && state.visible
      ? createPortal(
          <div
            id={tipId}
            role="tooltip"
            className="pointer-events-none fixed z-[9999] w-[min(300px,calc(100vw-24px))]"
            style={{
              left: state.x,
              top: state.y,
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0) scale(1)" : "translateY(4px) scale(0.97)",
              transition:
                "opacity 160ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="flex overflow-hidden rounded-[16px] border border-black/[0.06] bg-[#f4f5f7]/95 shadow-[0_14px_36px_-16px_rgba(11,31,68,0.42)] ring-1 ring-[#189b8e]/12 backdrop-blur-md">
              {/* Слева: предмет + звёзды */}
              <div className="relative flex w-[96px] shrink-0 flex-col items-center bg-white/40 p-2.5">
                <div
                  className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[12px] bg-cover bg-center shadow-sm ring-1 ring-black/[0.06]"
                  style={{ backgroundImage: `url(${rarityBg(stars)})` }}
                >
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt=""
                      className={
                        fit === "cover"
                          ? "h-full w-full object-cover object-top"
                          : "h-[86%] w-[86%] object-contain drop-shadow-sm"
                      }
                    />
                  ) : (
                    <span className="text-[9px] font-bold text-muted-foreground">?</span>
                  )}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/stars/Quality_star_${stars}.svg`}
                  alt=""
                  className="mt-1.5 h-3 w-auto drop-shadow"
                />
              </div>

              {/* Справа: название + описание */}
              <div className="min-w-0 flex-1 border-l border-black/[0.05] bg-white/80 px-3 py-2.5">
                <p className="font-genshin text-[13px] leading-snug tracking-wide text-[#1e1e1e]">
                  {name}
                </p>
                {loreText ? (
                  <p className="mt-1.5 line-clamp-4 text-[11px] font-medium leading-relaxed text-muted-foreground">
                    {loreText}
                  </p>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      className={className}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      aria-describedby={state.visible ? tipId : undefined}
    >
      {children}
      {tip}
    </div>
  );
}

/** Убрать HTML из описания для короткого лора в превью. */
export { plainLore } from "@/lib/wiki-guide-data";
