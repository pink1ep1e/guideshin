"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastKind = "error" | "success" | "info";

type ToastItem = {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
};

type AdminToastContextValue = {
  showToast: (opts: { kind?: ToastKind; title: string; message?: string; durationMs?: number }) => void;
  showError: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within AdminToastProvider");
  }
  return ctx;
}

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      kind = "info",
      title,
      message,
      durationMs = 5500,
    }: {
      kind?: ToastKind;
      title: string;
      message?: string;
      durationMs?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, message }]);
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const showError = useCallback(
    (title: string, message?: string) => showToast({ kind: "error", title, message, durationMs: 7000 }),
    [showToast],
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => showToast({ kind: "success", title, message }),
    [showToast],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, []);

  return (
    <AdminToastContext.Provider value={{ showToast, showError, showSuccess }}>
      {children}
      <div className="pointer-events-none fixed right-3 top-4 z-[220] flex w-[min(100vw-1.5rem,360px)] flex-col gap-2 sm:right-5 sm:top-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300 overflow-hidden rounded-[16px] shadow-[0_16px_40px_-12px_rgba(11,31,68,0.45)] ring-1 ${
              toast.kind === "error"
                ? "bg-white ring-destructive/20"
                : toast.kind === "success"
                  ? "bg-white ring-[#189b8e]/25"
                  : "bg-white ring-black/[0.08]"
            }`}
          >
            <div className="flex items-start gap-3 px-3.5 py-3">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  toast.kind === "error"
                    ? "bg-destructive/10 text-destructive"
                    : toast.kind === "success"
                      ? "bg-[#189b8e]/12 text-[#189b8e]"
                      : "bg-[#0b1f44]/[0.06] text-foreground"
                }`}
              >
                {toast.kind === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : toast.kind === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-foreground">{toast.title}</p>
                {toast.message ? (
                  <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground">
                    {toast.message}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-muted-foreground transition hover:bg-black/[0.04] hover:text-foreground"
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}
