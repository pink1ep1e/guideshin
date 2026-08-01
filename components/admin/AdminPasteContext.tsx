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

export type AdminPasteTarget = {
  id: string;
  label: string;
  kind: string;
  acceptImages: boolean;
  upload: (file: File) => Promise<void>;
};

type AdminPasteContextValue = {
  activate: (target: AdminPasteTarget) => void;
  deactivate: (id: string) => void;
  activeLabel: string | null;
};

const AdminPasteContext = createContext<AdminPasteContextValue | null>(null);

export function useAdminPaste() {
  return useContext(AdminPasteContext);
}

export function AdminPasteProvider({ children }: { children: ReactNode }) {
  const activeRef = useRef<AdminPasteTarget | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const activate = useCallback((target: AdminPasteTarget) => {
    activeRef.current = target;
    setActiveLabel(target.label);
  }, []);

  const deactivate = useCallback((id: string) => {
    if (activeRef.current?.id === id) {
      activeRef.current = null;
      setActiveLabel(null);
    }
  }, []);

  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items?.length) return;

      const imageItem = Array.from(items).find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;

      const file = imageItem.getAsFile();
      if (!file) return;

      const target = activeRef.current;
      if (!target || !target.acceptImages) {
        showToast("Кликните на поле изображения, затем Ctrl+V");
        return;
      }

      e.preventDefault();
      try {
        await target.upload(file);
        showToast(`Вставлено в «${target.label}»`);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Не удалось вставить изображение");
      }
    }

    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("paste", onPaste);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [showToast]);

  return (
    <AdminPasteContext.Provider value={{ activate, deactivate, activeLabel }}>
      {children}
      {activeLabel && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[#0b1f44]/90 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
          Ctrl+V → {activeLabel}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-14 left-1/2 z-[90] -translate-x-1/2 rounded-[14px] bg-[#189b8e] px-4 py-2.5 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminPasteContext.Provider>
  );
}
