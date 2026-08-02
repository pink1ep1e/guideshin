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
    const pad = 10;
    const tipW = 156;
    const tipH = loreText ? 190 : 145;
    const x = clamp(clientX + 12, pad, window.innerWidth - tipW - pad);
    const y = clamp(clientY + 12, pad, window.innerHeight - tipH - pad);
    setState({ x, y, visible: true });
  }, [loreText]);

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
            className="pointer-events-none fixed z-[9999] w-[min(156px,calc(100vw-20px))]"
            style={{
              left: state.x,
              top: state.y,
              opacity: shown ? 1 : 0,
              transform: shown ? "translateY(0) scale(1)" : "translateY(3px) scale(0.97)",
              transition:
                "opacity 140ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <div className="overflow-hidden rounded-[12px] border border-black/[0.06] bg-white/95 shadow-[0_10px_28px_-14px_rgba(11,31,68,0.4)] ring-1 ring-[#189b8e]/15 backdrop-blur-md">
              <div
                className="relative flex aspect-square items-center justify-center overflow-hidden bg-cover bg-center"
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
                        : "h-[78%] w-[78%] object-contain drop-shadow-sm"
                    }
                  />
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground">Нет иконки</span>
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/20 to-transparent" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/stars/Quality_star_${stars}.svg`}
                  alt=""
                  className="absolute bottom-1 left-1/2 h-2.5 w-auto -translate-x-1/2 drop-shadow"
                />
              </div>
              <div className="px-2 py-1.5">
                <p className="font-genshin text-[11px] leading-snug tracking-wide text-[#1e1e1e]">
                  {name}
                </p>
                {loreText ? (
                  <p className="mt-0.5 line-clamp-2 text-[9px] font-medium leading-snug text-muted-foreground">
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

