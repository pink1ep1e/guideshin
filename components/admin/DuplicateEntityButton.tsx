"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { invalidateGuideCatalog } from "@/components/admin/CatalogPicker";

const COUNTDOWN_MS = 3000;

/** Клонирует запись через GET + POST и открывает редактирование копии. */
export function DuplicateEntityButton({
  apiBase,
  id,
  name,
  editBase,
}: {
  apiBase: string;
  id: number;
  name: string;
  /** Например `/admin/characters` → редирект на `/admin/characters/{newId}/edit` */
  editBase: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    cancelledRef.current = false;
    startedRef.current = false;
    setSecondsLeft(3);
    setProgress(0);
    setError(null);
    setLoading(false);

    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      if (cancelledRef.current || startedRef.current) {
        window.clearInterval(tick);
        return;
      }
      const elapsed = Date.now() - startedAt;
      const leftMs = Math.max(0, COUNTDOWN_MS - elapsed);
      setProgress(Math.min(100, (elapsed / COUNTDOWN_MS) * 100));
      setSecondsLeft(Math.ceil(leftMs / 1000));
      if (leftMs <= 0) {
        window.clearInterval(tick);
        void runDuplicate();
      }
    }, 50);

    return () => {
      window.clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function cancel() {
    cancelledRef.current = true;
    setOpen(false);
    setSecondsLeft(3);
    setProgress(0);
    setError(null);
    setLoading(false);
  }

  async function runDuplicate() {
    if (cancelledRef.current || startedRef.current) return;
    startedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const getRes = await fetch(`${apiBase}/${id}`);
      if (!getRes.ok) {
        setError("Не удалось загрузить запись");
        setLoading(false);
        startedRef.current = false;
        return;
      }
      const src = (await getRes.json()) as Record<string, unknown>;
      const {
        id: _id,
        createdAt: _c,
        updatedAt: _u,
        ...rest
      } = src;

      const baseSlug =
        typeof rest.slug === "string" && rest.slug
          ? `${rest.slug}-copy`
          : `copy-${Date.now()}`;

      const body = {
        ...rest,
        name: `${String(rest.name ?? name)} (копия)`,
        slug: baseSlug,
        published: false,
      };

      const postRes = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!postRes.ok) {
        const err = (await postRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(err?.error || "Не удалось создать копию");
        setLoading(false);
        startedRef.current = false;
        return;
      }
      const created = (await postRes.json()) as { id: number };
      invalidateGuideCatalog();
      setOpen(false);
      router.push(`${editBase}/${created.id}/edit`);
      router.refresh();
    } catch {
      setError("Не удалось создать копию");
      setLoading(false);
      startedRef.current = false;
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen(true)}
        className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-bold text-[#189b8e] disabled:opacity-50"
      >
        {loading ? "…" : "Дублировать"}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-dialog-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-white p-5 shadow-panel">
              <p
                id="duplicate-dialog-title"
                className="font-display text-lg font-bold text-foreground"
              >
                Дублирование
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                Сейчас будет создана копия «{name}».
                {!loading && !error ? (
                  <>
                    {" "}
                    Через{" "}
                    <span className="font-bold tabular-nums text-[#189b8e]">
                      {Math.max(1, secondsLeft)}
                    </span>{" "}
                    сек. действие выполнится автоматически.
                  </>
                ) : null}
              </p>

              {error ? (
                <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={loading}
                  className="ui-btn-secondary flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => void runDuplicate()}
                  disabled={loading}
                  className="ui-btn-primary flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {loading ? "Копирую…" : "Дублировать сейчас"}
                </button>
              </div>

              {!loading && !error ? (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#189b8e]/15">
                  <div
                    className="h-full rounded-full bg-[#189b8e]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
