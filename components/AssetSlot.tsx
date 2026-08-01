"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AssetSlotProps = {
  src?: string | null;
  alt?: string;
  /** Путь, куда положить файл (показывается в плейсхолдере) */
  hint?: string;
  label?: string;
  className?: string;
  imgClassName?: string;
  rounded?: string;
  tone?: "dark" | "light";
};

/**
 * Слот под арт/ассет Genshin.
 * Нет файла или ошибка загрузки → плейсхолдер с путём для вставки.
 */
export default function AssetSlot({
  src,
  alt = "",
  hint,
  label,
  className,
  imgClassName,
  rounded = "rounded-3xl",
  tone = "dark",
}: AssetSlotProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  if (showImage) {
    return (
      <div className={cn("relative overflow-hidden bg-vtb-soft", rounded, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src!}
          alt={alt}
          className={cn("h-full w-full object-cover", imgClassName)}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const isLight = tone === "light";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 border border-dashed p-4 text-center",
        rounded,
        isLight
          ? "border-border bg-vtb-soft/80 text-muted-foreground"
          : "border-white/25 bg-white/5 text-white/70",
        className,
      )}
    >
      <ImageIcon className={cn("h-8 w-8", isLight ? "text-primary/50" : "text-white/50")} />
      {label && (
        <p
          className={cn(
            "font-genshin text-sm tracking-wide",
            isLight ? "text-foreground" : "text-white/90",
          )}
        >
          {label}
        </p>
      )}
      {hint && (
        <p className="max-w-[90%] break-all text-[11px] font-medium">
          Вставьте арт:{" "}
          <span className={isLight ? "text-foreground/80" : "text-white/80"}>{hint}</span>
        </p>
      )}
    </div>
  );
}
