"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2, X } from "lucide-react";
import FancySelect from "@/components/ui/FancySelect";
import WishCharacterAvatarModal from "@/components/wishes/WishCharacterAvatarModal";
import { SERVER_LABEL, WISH_SERVER_OPTIONS } from "@/lib/wish-servers";

export type EditableAccount = {
  id: string;
  label: string;
  server: string;
  avatarUrl?: string | null;
};

type Props = {
  account: EditableAccount | null;
  open: boolean;
  busy?: boolean;
  defaultAvatarUrl?: string | null;
  onClose: () => void;
  onSaved: (account: EditableAccount) => void;
};

export default function WishAccountEditDialog({
  account,
  open,
  busy,
  defaultAvatarUrl,
  onClose,
  onSaved,
}: Props) {
  const [label, setLabel] = useState("");
  const [server, setServer] = useState("europe");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarName, setAvatarName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  useEffect(() => {
    if (!account || !open) return;
    setLabel(account.label);
    setServer(account.server);
    setAvatarUrl(account.avatarUrl || null);
    setAvatarName(null);
    setError(null);
    setAvatarPickerOpen(false);
  }, [account, open]);

  if (!account) return null;

  const previewSrc = avatarUrl || defaultAvatarUrl || null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/wishes/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: account!.id,
          label: label.trim() || account!.label,
          server,
          avatarUrl,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        account?: EditableAccount;
      };
      if (!res.ok || !json.account) {
        throw new Error(json.error || "Не удалось сохранить");
      }
      onSaved({
        id: json.account.id,
        label: json.account.label,
        server: json.account.server,
        avatarUrl: json.account.avatarUrl ?? null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && !busy && onClose()}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-panel sm:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={saving}
                onClick={onClose}
                className="absolute right-3 top-3 rounded-xl p-2 text-foreground/50 transition hover:bg-black/[0.04]"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-genshin text-[1.65rem] text-foreground sm:text-3xl">
                Настройки аккаунта
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Имя, сервер и аватарка персонажа
              </p>

              <div className="mt-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setAvatarPickerOpen(true)}
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#eef8f6] ring-1 ring-black/[0.06]"
                  title="Выбрать аватар"
                >
                  {previewSrc ? (
                    <Image
                      src={previewSrc}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-[#189b8e]/70">
                      ?
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-[#0a2a26]/50 opacity-0 transition group-hover:opacity-100">
                    <Pencil className="h-6 w-6 text-white" />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">
                    {avatarName ||
                      (avatarUrl
                        ? "Персонаж выбран"
                        : "Путешественник (по умолчанию)")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {SERVER_LABEL[server] || server}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Нажмите на аватар, чтобы выбрать персонажа
                  </p>
                  {avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarUrl(null);
                        setAvatarName(null);
                      }}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Сбросить на Путешественника
                    </button>
                  ) : null}
                </div>
              </div>

              <label className="mt-5 block text-sm font-bold">Имя аккаунта</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Например, Основной"
                maxLength={40}
                className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-card px-3.5 py-3 text-sm text-foreground outline-none ring-[#189b8e]/30 placeholder:text-muted-foreground focus:ring-2 dark:border-white/10 dark:bg-white/[0.04]"
              />

              <div className="mt-4">
                <FancySelect
                  label="Сервер"
                  value={server}
                  onChange={setServer}
                  options={[...WISH_SERVER_OPTIONS]}
                  placeholder="Выберите сервер"
                />
              </div>

              {error ? (
                <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
              ) : null}

              <div className="mt-6 flex gap-2.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-black/[0.08] py-3 text-sm font-bold"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  disabled={saving || busy}
                  onClick={() => void save()}
                  className="flex-1 rounded-xl bg-[#189b8e] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving ? "Сохраняем…" : "Сохранить"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <WishCharacterAvatarModal
        open={avatarPickerOpen}
        selectedImage={avatarUrl || defaultAvatarUrl}
        onClose={() => setAvatarPickerOpen(false)}
        onPick={(item) => {
          setAvatarUrl(item.image);
          setAvatarName(item.name);
        }}
      />
    </>
  );
}

export function AccountEditHintButton({
  onClick,
  active,
}: {
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-lg p-1.5 transition ${
        active
          ? "bg-white/20 text-white hover:bg-white/30"
          : "bg-black/[0.04] text-foreground/60 hover:bg-black/[0.08] hover:text-foreground"
      }`}
      aria-label="Изменить аккаунт"
      title="Изменить имя и аватар"
    >
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}
