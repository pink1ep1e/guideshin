"use client";

import { useState } from "react";

type Props = {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
};

/** Tries splash art first, falls back to portrait if the file is missing. */
export default function CharacterSplashArt({
  src,
  fallbackSrc,
  alt,
  className,
}: Props) {
  const [current, setCurrent] = useState(src);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => {
        if (current !== fallbackSrc) setCurrent(fallbackSrc);
      }}
    />
  );
}
