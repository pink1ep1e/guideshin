"use client";

import { useEffect } from "react";

const SOUNDS = {
  button: "/sounds/button.mp3",
  talent: "/sounds/talant.mp3",
  constellation: "/sounds/sozvezdie.mp3",
} as const;

const VOLUME = 0.4;

const CLICKABLE =
  'button, [role="button"], input[type="button"], input[type="submit"], input[type="reset"], summary';

type SoundKind = keyof typeof SOUNDS;

function resolveClickable(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest(CLICKABLE);
  if (!el) return null;
  if (el.closest("[data-no-sound]")) return null;
  if (el.getAttribute("aria-disabled") === "true") return null;
  if (el instanceof HTMLButtonElement && el.disabled) return null;
  if (el instanceof HTMLInputElement && el.disabled) return null;
  return el;
}

function soundFor(el: Element): SoundKind {
  const custom = el.getAttribute("data-sound");
  if (custom === "talent" || custom === "button" || custom === "constellation") {
    return custom;
  }
  if (el.classList.contains("constellation-key") || el.closest(".constellation-key")) {
    return "constellation";
  }
  if (el.classList.contains("talent-key") || el.closest(".talent-key")) {
    return "talent";
  }
  return "button";
}

/**
 * Глобальный звук клика по кнопкам.
 * data-no-sound — без звука; data-sound="talent"|"constellation" — отдельный звук.
 * Круглые кнопки талантов / созвездий в гайдах играют свои mp3.
 */
export default function ClickSoundProvider() {
  useEffect(() => {
    const cache = new Map<SoundKind, HTMLAudioElement>();

    const ensure = (kind: SoundKind) => {
      let audio = cache.get(kind);
      if (!audio) {
        audio = new Audio(SOUNDS[kind]);
        audio.preload = "auto";
        audio.volume = VOLUME;
        cache.set(kind, audio);
      }
      return audio;
    };

    const warm = () => {
      (Object.keys(SOUNDS) as SoundKind[]).forEach((kind) => {
        ensure(kind).load();
      });
      window.removeEventListener("pointerdown", warm, true);
    };
    window.addEventListener("pointerdown", warm, true);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const el = resolveClickable(event.target);
      if (!el) return;

      try {
        const shot = ensure(soundFor(el)).cloneNode(true) as HTMLAudioElement;
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
      cache.clear();
    };
  }, []);

  return null;
}
