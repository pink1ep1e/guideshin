"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ClipboardPaste, Copy, Loader2, Terminal } from "lucide-react";
import { looksLikeWishAuthUrl } from "@/lib/wishes-client";

type Props = {
  busy: boolean;
  onImportUrl: (url: string) => Promise<void>;
  onImportJson: (payload: unknown) => Promise<void>;
  error: string | null;
  message: string | null;
  onClearFeedback?: () => void;
};

type Tab = "pc" | "json";

export default function WishImportWizard({
  busy,
  onImportUrl,
  onImportJson,
  error,
  message,
  onClearFeedback,
}: Props) {
  const [tab, setTab] = useState<Tab>("pc");
  const [oneLiner, setOneLiner] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const lastAutoImport = useRef("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishes/import-script")
      .then((r) => r.text())
      .then((text) => {
        if (!cancelled) setOneLiner(text.trim());
      })
      .catch(() => {
        if (!cancelled) {
          setOneLiner(
            "Set-ExecutionPolicy Bypass -Scope Process -Force; irm 'https://guideshin.ru/scripts/get-wish-url.ps1' | iex",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyScript = useCallback(async () => {
    if (!oneLiner) return;
    await navigator.clipboard.writeText(oneLiner);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [oneLiner]);

  const pasteAndImport = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!looksLikeWishAuthUrl(text)) {
        setLocalError(
          "В буфере нет ссылки молитв. Сначала запустите скрипт в PowerShell.",
        );
        return;
      }
      setUrl(text);
      lastAutoImport.current = text;
      await onImportUrl(text);
    } catch {
      setLocalError(
        "Нет доступа к буферу. Разрешите доступ или вставьте ссылку вручную ниже.",
      );
    }
  }, [onClearFeedback, onImportUrl]);

  const handleUrlPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const text = e.clipboardData.getData("text").trim();
      if (!looksLikeWishAuthUrl(text) || busy) return;
      if (lastAutoImport.current === text) return;
      lastAutoImport.current = text;
      setUrl(text);
      setLocalError(null);
      onClearFeedback?.();
      void onImportUrl(text);
    },
    [busy, onClearFeedback, onImportUrl],
  );

  const handleJsonImport = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    try {
      const payload = JSON.parse(jsonText);
      await onImportJson(payload);
    } catch {
      setLocalError("Некорректный JSON. Вставьте полный экспорт UIGF / paimon.moe.");
    }
  }, [jsonText, onClearFeedback, onImportJson]);

  const feedbackError = localError || error;

  return (
    <div className="glass-panel p-5 sm:p-6">
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#189b8e]">
        Импорт
      </p>
      <h2 className="section-title mb-2 text-[22px]">Добавить молитвы</h2>
      <p className="mb-4 text-sm font-medium leading-relaxed text-muted-foreground">
        На PC: скопируйте команду → PowerShell → затем одна кнопка «из буфера».
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
            tab === "pc"
              ? "bg-[#189b8e] text-white"
              : "bg-[#189b8e]/10 text-[#189b8e]"
          }`}
          onClick={() => setTab("pc")}
        >
          PC — одной командой
        </button>
        <button
          type="button"
          className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
            tab === "json"
              ? "bg-[#189b8e] text-white"
              : "bg-[#189b8e]/10 text-[#189b8e]"
          }`}
          onClick={() => setTab("json")}
        >
          JSON / paimon.moe
        </button>
      </div>

      {tab === "pc" ? (
        <div className="space-y-4">
          <ol className="space-y-3 text-sm font-medium text-foreground/85">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#189b8e]/15 text-xs font-bold text-[#189b8e]">
                1
              </span>
              <span>
                Откройте Genshin → <strong>История молитв</strong> и дождитесь
                загрузки списка.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#189b8e]/15 text-xs font-bold text-[#189b8e]">
                2
              </span>
              <span>
                Win + R → <code className="rounded bg-black/[0.06] px-1">powershell</code> →
                Enter → вставьте команду:
              </span>
            </li>
          </ol>

          <div className="rounded-xl border border-black/[0.08] bg-[#0b1f1c] p-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#67d5cc]">
              <Terminal className="h-3.5 w-3.5" />
              PowerShell
            </p>
            <p className="break-all font-mono text-[11px] leading-relaxed text-white/90">
              {oneLiner || "Загрузка команды…"}
            </p>
          </div>

          <button
            type="button"
            disabled={!oneLiner || busy}
            onClick={() => void copyScript()}
            className="ui-btn-primary flex w-full items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                1. Скопировать команду
              </>
            )}
          </button>

          <p className="text-sm font-medium text-foreground/85">
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#189b8e]/15 text-xs font-bold text-[#189b8e]">
              3
            </span>
            После Enter в PowerShell нажмите:
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => void pasteAndImport()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#189b8e]/12 px-4 py-3 text-sm font-bold text-[#189b8e] transition hover:bg-[#189b8e]/20 disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Импортируем…
              </>
            ) : (
              <>
                <ClipboardPaste className="h-4 w-4" />
                2. Вставить из буфера и импортировать
              </>
            )}
          </button>

          <details className="rounded-xl border border-black/[0.06] bg-white/60 p-3">
            <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
              Вставить ссылку вручную
            </summary>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onPaste={handleUrlPaste}
              rows={3}
              placeholder="https://…authkey=…"
              className="mt-3 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
            />
            <button
              type="button"
              disabled={busy || !url.trim()}
              className="ui-btn-secondary mt-2 w-full"
              onClick={() => {
                setLocalError(null);
                onClearFeedback?.();
                void onImportUrl(url.trim());
              }}
            >
              Импортировать ссылку
            </button>
          </details>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Экспорт из paimon.moe / UIGF JSON — вставьте целиком.
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={8}
            placeholder='{"list":[...]} или UIGF'
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 font-mono text-xs outline-none ring-[#189b8e]/30 focus:ring-2"
          />
          <button
            type="button"
            disabled={busy || !jsonText.trim()}
            className="ui-btn-primary mt-3 w-full"
            onClick={() => void handleJsonImport()}
          >
            {busy ? "Импортируем…" : "Импортировать JSON"}
          </button>
        </div>
      )}

      {feedbackError && (
        <p className="mt-3 text-sm font-medium text-red-600">{feedbackError}</p>
      )}
      {message && (
        <p className="mt-3 text-sm font-medium text-[#189b8e]">{message}</p>
      )}
    </div>
  );
}
