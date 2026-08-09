"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  ClipboardPaste,
  Copy,
  Loader2,
  AlertCircle,
  Upload,
  Smartphone,
  Monitor,
  Cloud,
} from "lucide-react";
import { looksLikeWishAuthUrl } from "@/lib/wishes-client";
import type { WishImportProgress } from "@/lib/wishes";

type Props = {
  busy: boolean;
  progress: WishImportProgress | null;
  onImportUrl: (url: string) => Promise<void>;
  onImportJson: (payload: unknown) => Promise<void>;
  error: string | null;
  message: string | null;
  onClearFeedback?: () => void;
  compact?: boolean;
};

type Platform = "pc" | "android" | "ios" | "paimon";

export default function WishImportWizard({
  busy,
  progress,
  onImportUrl,
  onImportJson,
  error,
  message,
  onClearFeedback,
  compact = false,
}: Props) {
  const [platform, setPlatform] = useState<Platform>("pc");
  const [oneLiner, setOneLiner] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
          "В буфере нет ссылки. Сначала получите её по инструкции выше.",
        );
        return;
      }
      setUrl(text);
      await onImportUrl(text);
    } catch {
      setLocalError("Нет доступа к буферу. Вставьте ссылку вручную ниже.");
    }
  }, [onClearFeedback, onImportUrl]);

  const importManualUrl = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    const text = url.trim();
    if (!looksLikeWishAuthUrl(text)) {
      setLocalError("Нужна полная ссылка с authkey.");
      return;
    }
    await onImportUrl(text);
  }, [onClearFeedback, onImportUrl, url]);

  const handleFile = useCallback(
    async (file: File) => {
      setLocalError(null);
      onClearFeedback?.();
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        await onImportJson(payload);
      } catch {
        setLocalError(
          "Не удалось прочитать файл. Нужен JSON-экспорт paimon.moe / UIGF.",
        );
      }
    },
    [onClearFeedback, onImportJson],
  );

  const importFromDriveLink = useCallback(async () => {
    setLocalError(null);
    onClearFeedback?.();
    const link = driveUrl.trim();
    if (!link) {
      setLocalError("Вставьте ссылку на файл Google Drive.");
      return;
    }
    try {
      const res = await fetch("/api/wishes/import-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link }),
      });
      const json = (await res.json()) as {
        error?: string;
        payload?: unknown;
      };
      if (!res.ok || !json.payload) {
        throw new Error(json.error || "Не удалось скачать файл с Drive");
      }
      await onImportJson(json.payload);
    } catch (e) {
      setLocalError(
        e instanceof Error
          ? e.message
          : "Не удалось импортировать с Google Drive",
      );
    }
  }, [driveUrl, onClearFeedback, onImportJson]);

  const feedbackError = localError || error;
  const progressPct =
    progress && progress.steps > 0
      ? Math.min(
          100,
          Math.round(
            ((progress.phase === "saving" || progress.phase === "done"
              ? progress.steps
              : Math.max(0, progress.step - 1)) /
              progress.steps) *
              100 +
              (progress.phase === "banner" ? 8 : 0),
          ),
        )
      : busy
        ? 12
        : 0;

  const tabs: { id: Platform; label: string; icon: React.ReactNode }[] = [
    { id: "pc", label: "PC", icon: <Monitor className="h-3.5 w-3.5" /> },
    {
      id: "android",
      label: "Android",
      icon: <Smartphone className="h-3.5 w-3.5" />,
    },
    { id: "ios", label: "iOS", icon: <Smartphone className="h-3.5 w-3.5" /> },
    { id: "paimon", label: "Paimon", icon: <Cloud className="h-3.5 w-3.5" /> },
  ];

  return (
    <div
      id="wish-import"
      className={`overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_32px_-20px_rgba(15,70,60,0.35)] ${
        compact ? "" : ""
      }`}
    >
      <div
        className={`border-b border-black/[0.05] bg-gradient-to-br from-[#e8f7f5] via-white to-[#f3fbfa] ${
          compact ? "px-4 py-4" : "px-5 py-5"
        }`}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#189b8e]">
          Автоимпорт
        </p>
        <h2
          className={`mt-0.5 font-genshin tracking-wide text-foreground ${
            compact ? "text-xl" : "text-2xl"
          }`}
        >
          Импорт молитв
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">
          Выберите платформу — короткая инструкция и импорт в одном месте.
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPlatform(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                platform === t.id
                  ? "bg-[#189b8e] text-white"
                  : "bg-white/90 text-foreground/70 ring-1 ring-black/[0.06]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className={compact ? "space-y-4 px-4 py-4" : "space-y-5 px-5 py-5"}>
        {platform === "pc" && (
          <ol className="space-y-4 text-sm leading-relaxed">
            <Step n={1} title="История в игре">
              Молитва → История молитв → дождитесь загрузки → закройте окно.
            </Step>
            <Step n={2} title="Команда в PowerShell">
              Win+R → <code className="rounded bg-black/[0.06] px-1">powershell</code> →
              вставьте команду:
              <div className="mt-2 rounded-xl bg-[#0d1f1c] p-2.5">
                <p className="break-all font-mono text-[10px] leading-relaxed text-[#9be8df]">
                  {oneLiner || "Загрузка…"}
                </p>
              </div>
              <button
                type="button"
                disabled={!oneLiner || busy}
                onClick={() => void copyScript()}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#189b8e] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Скопировать
                  </>
                )}
              </button>
            </Step>
            <Step n={3} title="Импорт">
              <ImportActions
                busy={busy}
                onPaste={() => void pasteAndImport()}
              />
            </Step>
          </ol>
        )}

        {platform === "android" && (
          <ol className="space-y-4 text-sm leading-relaxed">
            <Step n={1} title="Откройте историю">
              В Genshin: Молитва → История молитв, дождитесь загрузки.
            </Step>
            <Step n={2} title="Скопируйте ссылку">
              Нажмите «Поделиться» (или меню) в окне истории → «Копировать
              ссылку». Если кнопки нет — откройте историю через браузер телефона
              после входа в аккаунт HoYoverse.
            </Step>
            <Step n={3} title="Вставьте сюда">
              <ImportActions
                busy={busy}
                onPaste={() => void pasteAndImport()}
              />
            </Step>
          </ol>
        )}

        {platform === "ios" && (
          <ol className="space-y-4 text-sm leading-relaxed">
            <Step n={1} title="Откройте историю">
              В Genshin: Молитва → История молитв, дождитесь загрузки.
            </Step>
            <Step n={2} title="Поделиться → Скопировать">
              В углу окна истории нажмите «Поделиться» → «Скопировать». Ссылка с
              authkey попадёт в буфер.
            </Step>
            <Step n={3} title="Импорт на сайте">
              Вернитесь в Safari/Chrome на Guideshin и нажмите кнопку ниже.
              <div className="mt-2">
                <ImportActions
                  busy={busy}
                  onPaste={() => void pasteAndImport()}
                />
              </div>
            </Step>
          </ol>
        )}

        {platform === "paimon" && (
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="text-foreground/75">
              Синк paimon.moe в Google Drive доступен только самому paimon.moe.
              Экспортируйте данные и загрузите сюда — или дайте публичную ссылку
              на JSON-файл на вашем Drive.
            </p>
            <ol className="space-y-4">
              <Step n={1} title="Экспорт в paimon.moe">
                paimon.moe → Settings → Export & Import Data → Download Data.
                Можно заранее включить Drive Sync и потом скачать/загрузить файл
                в свой Google Drive.
              </Step>
              <Step n={2} title="Загрузить JSON">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#189b8e] px-3.5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Выбрать файл paimon.moe
                </button>
              </Step>
              <Step n={3} title="Или ссылка Google Drive">
                Файл → «Открыть доступ» → «Все, у кого есть ссылка» → вставьте
                ссылку:
                <input
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/…"
                  className="mt-2 w-full rounded-xl border border-black/[0.08] px-3 py-2 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
                />
                <button
                  type="button"
                  disabled={busy || !driveUrl.trim()}
                  onClick={() => void importFromDriveLink()}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border-2 border-[#189b8e] px-3.5 py-2 text-xs font-bold text-[#189b8e] disabled:opacity-50"
                >
                  <Cloud className="h-3.5 w-3.5" />
                  Импорт с Drive
                </button>
              </Step>
            </ol>
          </div>
        )}

        {(busy || progress) && (
          <div className="rounded-xl border border-[#189b8e]/25 bg-[#e8f7f5] p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-[#0f5c54]">
                {progress?.label || "Импортируем…"}
              </p>
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#189b8e]" />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/80">
              <div
                className="h-full rounded-full bg-[#189b8e] transition-all duration-500"
                style={{ width: `${Math.max(progressPct, 8)}%` }}
              />
            </div>
            {progress && (
              <p className="mt-2 text-xs font-medium text-[#0f5c54]/85">
                {progress.step > 0
                  ? `Баннер ${progress.step}/${progress.steps}`
                  : null}
                {progress.page > 0 ? ` · стр. ${progress.page}` : null}
                {` · собрано ${progress.totalPulled.toLocaleString("ru-RU")}`}
              </p>
            )}
          </div>
        )}

        {platform !== "paimon" && (
          <details className="rounded-xl border border-black/[0.06] bg-[#f7faf9] p-3">
            <summary className="cursor-pointer text-xs font-bold text-foreground/65">
              Вставить ссылку вручную
            </summary>
            <textarea
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              rows={2}
              placeholder="https://…authkey=…"
              className="mt-2 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm outline-none ring-[#189b8e]/30 focus:ring-2"
            />
            <button
              type="button"
              disabled={busy || !url.trim()}
              className="mt-2 w-full rounded-lg border border-[#189b8e] py-2 text-xs font-bold text-[#189b8e] disabled:opacity-50"
              onClick={() => void importManualUrl()}
            >
              Импортировать
            </button>
          </details>
        )}

        {feedbackError && (
          <div className="flex gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-relaxed text-red-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">Ошибка импорта</p>
              <p className="mt-0.5">{feedbackError}</p>
            </div>
          </div>
        )}
        {message && !feedbackError && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-900">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#189b8e] text-xs font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-foreground">{title}</p>
        <div className="mt-1 text-foreground/70">{children}</div>
      </div>
    </li>
  );
}

function ImportActions({
  busy,
  onPaste,
}: {
  busy: boolean;
  onPaste: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onPaste}
      className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#189b8e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#147f74] disabled:opacity-70 sm:w-auto"
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
  );
}
