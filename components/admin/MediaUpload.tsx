"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ClipboardPaste, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useAdminPaste } from "@/components/admin/AdminPasteContext";

type UploadKind = "icon" | "splash" | "weapon" | "artifact" | "material" | "video" | "other";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind: UploadKind;
  hint?: string;
  accept?: string;
  preview?: "image" | "video" | "none";
  /** Только квадрат превью — для списков материалов в гайде */
  compact?: boolean;
  className?: string;
};

export async function uploadFile(file: File, kind: UploadKind) {
  const body = new FormData();
  body.append("file", file);
  body.append("kind", kind);
  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ошибка загрузки");
  return data.url as string;
}

export default function MediaUpload({
  label,
  value,
  onChange,
  kind,
  hint,
  accept,
  preview = "image",
  compact = false,
  className = "",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const kindRef = useRef(kind);
  onChangeRef.current = onChange;
  kindRef.current = kind;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const paste = useAdminPaste();
  const reactId = useId();
  const acceptImages = kind !== "video";

  const onFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const url = await uploadFile(file, kindRef.current);
      onChangeRef.current(url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ошибка загрузки";
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!paste || !acceptImages || !focused) return;
    paste.activate({
      id: reactId,
      label,
      kind,
      acceptImages,
      upload: async (file: File) => {
        await onFile(file);
      },
    });
    return () => paste.deactivate(reactId);
  }, [focused, reactId, label, kind, acceptImages, paste, onFile]);

  const shellProps = {
    className: `rounded-[14px] p-0.5 transition ${focused ? "ring-2 ring-[#189b8e]/40" : ""} ${className}`,
    tabIndex: acceptImages ? (0 as const) : undefined,
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setFocused(false);
      }
    },
    onMouseDown: () => {
      if (acceptImages) setFocused(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!acceptImages) return;
      e.preventDefault();
      setFocused(true);
    },
    onDrop: (e: React.DragEvent) => {
      if (!acceptImages) return;
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file?.type.startsWith("image/")) void onFile(file);
    },
  };

  if (compact) {
    return (
      <div {...shellProps}>
        <p className="mb-1 flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          <span>{label}</span>
          {acceptImages && (
            <span className="inline-flex items-center gap-0.5 normal-case tracking-normal text-[#189b8e]">
              <ClipboardPaste className="h-2.5 w-2.5" />
              V
            </span>
          )}
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[12px] bg-[#0b1f44]/[0.04] ring-1 ring-black/[0.06] transition hover:ring-[#189b8e]/40 disabled:opacity-60"
          title="Загрузить или Ctrl+V"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#189b8e]" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground/50" />
          )}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="mt-1 text-[10px] font-bold text-muted-foreground hover:text-destructive"
          >
            Убрать
          </button>
        )}
        {error && <p className="mt-1 text-[10px] font-semibold text-destructive">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept || "image/*"}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  return (
    <div {...shellProps}>
      <label className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
        <span>{label}</span>
        {acceptImages && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold normal-case tracking-normal text-[#189b8e]">
            <ClipboardPaste className="h-3 w-3" />
            Ctrl+V
          </span>
        )}
      </label>

      <div className="flex flex-wrap items-start gap-3">
        {preview === "image" && (
          <div className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#0b1f44]/[0.04] ring-1 ring-black/[0.06]">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
            )}
          </div>
        )}

        {preview === "video" && value && !value.includes("youtube") && !value.includes("youtu.be") && (
          <video
            src={value}
            className="h-[88px] w-[140px] rounded-[14px] object-cover ring-1 ring-black/[0.06]"
            muted
          />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#189b8e] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {loading ? "Загрузка…" : "Загрузить"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-black/[0.06]"
              >
                <X className="h-3.5 w-3.5" />
                Убрать
              </button>
            )}
          </div>
          <input
            className="w-full rounded-[12px] border border-black/[0.08] bg-white/90 px-3 py-2 text-xs font-medium outline-none ring-[#189b8e]/25 focus:ring-2"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={hint || "или URL · можно Ctrl+V картинку"}
            onFocus={() => setFocused(true)}
          />
          {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept || (kind === "video" ? "video/mp4,video/webm" : "image/*")}
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}
