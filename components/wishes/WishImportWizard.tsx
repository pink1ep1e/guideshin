"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardPaste, Copy, Loader2 } from "lucide-react";
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
          "В буфере нет ссылки. Сначала выполните команду в PowerShell.",
        );
        return;
      }
      setUrl(text);
      await onImportUrl(text);
    } catch {
      setLocalError(
        "Нет доступа к буферу. Вставьте ссылку вручную в поле ниже.",
      );
    }
  }, [onClearFeedback, onImportUrl]);

  const handleJsonImport = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    try {
      const payload = JSON.parse(jsonText);
      await onImportJson(payload);
    } catch {
      setLocalError("Некорректный JSON. Вставьте экспорт UIGF / paimon.moe.");
    }
  }, [jsonText, onClearFeedback, onImportJson]);

  const feedbackError = localError || error;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 sm:p-6">
      <h2 className="mb-1 font-genshin text-2xl text-foreground">
        Импорт с PC
      </h2>
      <p className="mb-5 text-sm text-muted-foreground">
        Три шага: открыть историю в игре → команда в PowerShell → вставить сюда.
      </p>

      <div className="mb-5 flex gap-2">
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
            tab === "pc"
              ? "bg-[#189b8e] text-white"
              : "bg-black/[0.04] text-foreground/70"
          }`}
          onClick={() => setTab("pc")}
        >
          PC
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
            tab === "json"
              ? "bg-[#189b8e] text-white"
              : "bg-black/[0.04] text-foreground/70"
          }`}
          onClick={() => setTab("json")}
        >
          JSON
        </button>
      </div>

      {tab === "pc" ? (
        <div className="space-y-5">
          <ol className="space-y-4 text-sm leading-relaxed text-foreground/90">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#189b8e] text-xs font-bold text-white">
                1
              </span>
              <div>
                <p className="font-bold">Откройте историю молитв</p>
                <p className="text-muted-foreground">
                  Genshin → Молитва → История молитв. Дождитесь загрузки списка,
                  затем закройте окно.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#189b8e] text-xs font-bold text-white">
                2
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold">Запустите команду в PowerShell</p>
                <p className="mb-2 text-muted-foreground">
                  Win+R → напишите <code className="rounded bg-black/[0.06] px-1">powershell</code> →
                  Enter → вставьте команду:
                </p>
                <div className="rounded-xl bg-[#111] p-3">
                  <p className="break-all font-mono text-[11px] leading-relaxed text-white/90">
                    {oneLiner || "Загрузка…"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!oneLiner || busy}
                  onClick={() => void copyScript()}
                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#189b8e] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Скопировано
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Скопировать команду
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Если всё ок — в окне будет «OK! Link copied to clipboard».
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#189b8e] text-xs font-bold text-white">
                3
              </span>
              <div className="min-w-0 flex-1">
                <p className="mb-2 font-bold">Вернитесь сюда и импортируйте</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void pasteAndImport()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#189b8e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#147f74] disabled:opacity-60 sm:w-auto"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Импортируем…
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="h-4 w-4" />
                      Вставить из буфера
                    </>
                  )}
                </button>
              </div>
            </li>
          </ol>

          <details className="rounded-xl border border-black/[0.06] bg-[#f7faf9] p-3">
            <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
              Ссылка не скопировалась — вставить вручную
            </summary>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={3}
              placeholder="https://…authkey=…"
              className="mt-3 w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
            />
            <button
              type="button"
              disabled={busy || !url.trim()}
              className="mt-2 w-full rounded-lg border border-[#189b8e] px-3 py-2 text-sm font-bold text-[#189b8e] disabled:opacity-50"
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
          <p className="mb-3 text-sm text-muted-foreground">
            Вставьте экспорт UIGF / paimon.moe целиком.
          </p>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={8}
            placeholder='{"list":[...]}'
            className="w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 font-mono text-xs outline-none ring-[#189b8e]/30 focus:ring-2"
          />
          <button
            type="button"
            disabled={busy || !jsonText.trim()}
            className="mt-3 w-full rounded-xl bg-[#189b8e] px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
            onClick={() => void handleJsonImport()}
          >
            {busy ? "Импортируем…" : "Импортировать JSON"}
          </button>
        </div>
      )}

      {feedbackError && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {feedbackError}
        </p>
      )}
      {message && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          {message}
        </p>
      )}
    </div>
  );
}
