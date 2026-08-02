"use client";

import { Search, X } from "lucide-react";

export type AdminFilterOption = { value: string; label: string };

export type AdminFilterGroup = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminFilterOption[];
};

export default function AdminListToolbar({
  query,
  onQuery,
  placeholder = "Поиск…",
  filters = [],
  resultCount,
  totalCount,
}: {
  query: string;
  onQuery: (value: string) => void;
  placeholder?: string;
  filters?: AdminFilterGroup[];
  resultCount: number;
  totalCount: number;
}) {
  const hasFilters =
    query.trim().length > 0 || filters.some((f) => f.value !== "ALL");

  function reset() {
    onQuery("");
    filters.forEach((f) => f.onChange("ALL"));
  }

  return (
    <div className="space-y-3 border-b border-black/[0.06] bg-white/70 px-4 py-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#189b8e]" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-[14px] border border-black/[0.08] bg-white py-2.5 pl-10 pr-10 text-sm font-medium outline-none ring-[#189b8e]/25 placeholder:text-muted-foreground focus:ring-2"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQuery("")}
            className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {filters.length > 0 ? (
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {filters.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt) => {
                  const active = group.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => group.onChange(opt.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                        active
                          ? "bg-[#189b8e] text-white"
                          : "bg-white text-foreground/70 ring-1 ring-black/[0.06] hover:bg-[#189b8e]/10 hover:text-[#189b8e]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <p>
          Показано{" "}
          <span className="font-bold text-foreground">{resultCount}</span> из{" "}
          <span className="font-bold text-foreground">{totalCount}</span>
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={reset}
            className="font-bold text-[#189b8e] hover:underline"
          >
            Сбросить фильтры
          </button>
        ) : null}
      </div>
    </div>
  );
}
