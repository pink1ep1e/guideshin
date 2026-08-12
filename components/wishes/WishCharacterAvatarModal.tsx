"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import {
  useGuideCatalog,
  type CatalogCharacter,
} from "@/components/admin/CatalogPicker";
import { ELEMENT_LABEL, rarityStarsFromEnum, sortByRarityDesc } from "@/lib/genshin";

type Props = {
  open: boolean;
  selectedImage?: string | null;
  onClose: () => void;
  onPick: (character: { name: string; image: string }) => void;
};

export default function WishCharacterAvatarModal({
  open,
  selectedImage,
  onClose,
  onPick,
}: Props) {
  const { catalog, loaded } = useGuideCatalog();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());

  const list = useMemo(() => {
    const chars = sortByRarityDesc(
      catalog.characters.map((c) => ({
        ...c,
        rarityStars: rarityStarsFromEnum(c.rarity),
      })),
      (c) => c.rarityStars,
      (c) => c.name,
    );
    if (!deferred) return chars;
    return chars.filter((c) => c.name.toLowerCase().includes(deferred));
  }, [catalog.characters, deferred]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-black/[0.05] px-5 py-4 sm:px-6">
              <div>
                <h3 className="font-genshin text-2xl text-foreground sm:text-[1.75rem]">
                  Выбор аватара
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Найдите персонажа по имени
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-foreground/50 transition hover:bg-black/[0.04]"
                aria-label="Закрыть"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border-b border-black/[0.05] px-5 py-3 sm:px-6">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Имя персонажа…"
                  autoFocus
                  className="w-full rounded-2xl border border-black/[0.08] bg-card py-3 pl-10 pr-3.5 text-sm text-foreground outline-none ring-[#189b8e]/25 focus:ring-2 dark:border-white/10 dark:bg-white/[0.04]"
                />
              </label>
            </div>

            <div className="gs-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {!loaded ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                  Загружаем персонажей…
                </p>
              ) : list.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                  Никого не найдено
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
                  {list.map((c: CatalogCharacter & { rarityStars?: number }) => {
                    const active = selectedImage === c.image;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onPick({ name: c.name, image: c.image });
                          onClose();
                        }}
                        className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                          active
                            ? "border-[#189b8e] ring-2 ring-[#189b8e]/25"
                            : "border-black/[0.06] hover:border-[#189b8e]/40 hover:bg-[#189b8e]/5"
                        }`}
                      >
                        <div className="relative aspect-square bg-[#eef8f6]">
                          <Image
                            src={c.image}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        </div>
                        <div className="px-2 py-2">
                          <p className="truncate text-xs font-bold text-foreground">
                            {c.name}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {ELEMENT_LABEL[c.element] || c.element}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
