"use client";

import { useEffect } from "react";

const SOUND_SRC = "/sounds/button.mp3";
const VOLUME = 0.4;

const CLICKABLE =
  'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], summary';

function isSoundTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest(CLICKABLE);
  if (!el) return false;
  if (el.closest("[data-no-sound]")) return false;
  if (el.getAttribute("aria-disabled") === "true") return false;
  if (el instanceof HTMLButtonElement && el.disabled) return false;
  if (el instanceof HTMLInputElement && el.disabled) return false;
  return true;
}

/**
 * Глобальный звук клика по кнопкам. На элемент: data-no-sound — без звука.
 */
export default function ClickSoundProvider() {
  useEffect(() => {
    let shared: HTMLAudioElement | null = null;

    const ensure = () => {
      if (!shared) {
        shared = new Audio(SOUND_SRC);
        shared.preload = "auto";
        shared.volume = VOLUME;
      }
      return shared;
    };

    // Прогрев после первого жеста (политика автоплея браузера)
    const warm = () => {
      const a = ensure();
      a.load();
      window.removeEventListener("pointerdown", warm, true);
    };
    window.addEventListener("pointerdown", warm, true);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (!isSoundTarget(event.target)) return;

      try {
        const base = ensure();
        const shot = base.cloneNode(true) as HTMLAudioElement;
        shot.volume = VOLUME;
        void shot.play().catch(() => {
          /* автоплей / прервано — игнор */
        });
      } catch {
        /* ignore */
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", warm, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      shared = null;
    };
  }, []);

  return null;
}
