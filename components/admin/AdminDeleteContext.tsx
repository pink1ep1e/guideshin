"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Undo2, X } from "lucide-react";

const TOAST_MS = 10_000;

type ConfirmState = {
  name: string;
  onConfirm: () => void;
};

type UndoToast = {
  id: string;
  key: string;
  name: string;
  startedAt: number;
};

type ScheduleDeleteArgs = {
  /** Уникальный ключ, напр. `character:12` */
  key: string;
  name: string;
  /** Реальный DELETE + refresh — вызывается после истечения тоста */
  execute: () => Promise<void>;
};

type AdminDeleteContextValue = {
  requestDelete: (args: ScheduleDeleteArgs) => void;
  isPending: (key: string) => boolean;
  pendingKeys: ReadonlySet<string>;
};

const AdminDeleteContext = createContext<AdminDeleteContextValue | null>(null);

export function useAdminDelete() {
  const ctx = useContext(AdminDeleteContext);
  if (!ctx) {
    throw new Error("useAdminDelete must be used within AdminDeleteProvider");
  }
  return ctx;
}

/** Безопасно для списков: false, если провайдера нет. */
export function useIsDeletePending(key: string) {
  const ctx = useContext(AdminDeleteContext);
  return ctx?.isPending(key) ?? false;
}

export function AdminDeleteProvider({ children }: { children: ReactNode }) {
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [toasts, setToasts] = useState<UndoToast[]>([]);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(() => new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const executeRef = useRef<Map<string, () => Promise<void>>>(new Map());

  const clearKey = useCallback((key: string) => {
    const timer = timersRef.current.get(key);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(key);
    executeRef.current.delete(key);
    setToasts((prev) => prev.filter((t) => t.key !== key));
    setPendingKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const commitDelete = useCallback(
    async (key: string) => {
      const exec = executeRef.current.get(key);
      timersRef.current.delete(key);
      executeRef.current.delete(key);
      setToasts((prev) => prev.filter((t) => t.key !== key));
      try {
        await exec?.();
      } finally {
        setPendingKeys((prev) => {
          if (!prev.has(key)) return prev;
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [],
  );

  const undoDelete = useCallback(
    (key: string) => {
      clearKey(key);
    },
    [clearKey],
  );

  const requestDelete = useCallback((args: ScheduleDeleteArgs) => {
    setConfirm({
      name: args.name,
      onConfirm: () => {
        setConfirm(null);

        const prevTimer = timersRef.current.get(args.key);
        if (prevTimer) clearTimeout(prevTimer);

        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.add(args.key);
          return next;
        });
        executeRef.current.set(args.key, args.execute);

        const toastId = `${args.key}:${Date.now()}`;
        setToasts((prev) => [
          ...prev.filter((t) => t.key !== args.key),
          { id: toastId, key: args.key, name: args.name, startedAt: Date.now() },
        ]);

        const timer = setTimeout(() => {
          void commitDelete(args.key);
        }, TOAST_MS);
        timersRef.current.set(args.key, timer);
      },
    });
  }, [commitDelete]);

  const isPending = useCallback(
    (key: string) => pendingKeys.has(key),
    [pendingKeys],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!confirm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirm(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm]);

  const value = useMemo(
    () => ({ requestDelete, isPending, pendingKeys }),
    [requestDelete, isPending, pendingKeys],
  );

  return (
    <AdminDeleteContext.Provider value={value}>
      {children}

      {confirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0b1f44]/45 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => setConfirm(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-delete-title"
            className="w-full max-w-md overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-20px_rgba(11,31,68,0.45)] ring-1 ring-black/[0.06]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-black/[0.06] px-5 py-4">
              <p
                id="admin-delete-title"
                className="font-display text-lg font-bold text-foreground"
              >
                Удалить «{confirm.name}»?
              </p>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted-foreground">
                Элемент исчезнет из списка. В течение 10 секунд удаление можно
                отменить.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-sm font-bold text-foreground/80 transition hover:bg-[#f7f8fa]"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirm.onConfirm}
                className="rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-white transition hover:bg-destructive/90"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[210] flex w-[min(100vw-2rem,360px)] flex-col gap-2">
        {toasts.map((toast) => (
          <DeleteUndoToast
            key={toast.id}
            name={toast.name}
            startedAt={toast.startedAt}
            onUndo={() => undoDelete(toast.key)}
            onDismiss={() => void commitDelete(toast.key)}
          />
        ))}
      </div>
    </AdminDeleteContext.Provider>
  );
}

function DeleteUndoToast({
  name,
  startedAt,
  onUndo,
  onDismiss,
}: {
  name: string;
  startedAt: number;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let raf = 0;
    function tick() {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, 100 - (elapsed / TOAST_MS) * 100);
      setProgress(left);
      if (left > 0) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startedAt]);

  return (
    <div className="pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300 overflow-hidden rounded-[16px] bg-[#0b1f44] text-white shadow-[0_16px_40px_-12px_rgba(11,31,68,0.55)] ring-1 ring-white/10">
      <div className="flex items-start gap-3 px-4 pb-3 pt-3.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/55">
            Удалено
          </p>
          <p className="mt-0.5 truncate text-sm font-bold">{name}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-4 pb-3.5">
        <button
          type="button"
          onClick={onUndo}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#189b8e] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#157f74]"
        >
          <Undo2 className="h-3.5 w-3.5" />
          Отменить удаление
        </button>
      </div>
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-[#189b8e] transition-[width] duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
