"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
  triggerLabel?: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  triggerClassName?: string;
  onValueChange: (value: string) => void;
}

export function SearchableSelect({
  value,
  options,
  placeholder = "Pilih item",
  searchPlaceholder = "Cari...",
  emptyMessage = "Tidak ada pilihan yang cocok.",
  disabled = false,
  triggerClassName,
  onValueChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystack = [
        option.label,
        option.description,
        option.searchText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="searchable-select-listbox"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 neo-input bg-bg-card px-3 py-2 text-sm font-medium text-left disabled:cursor-not-allowed disabled:opacity-50",
            triggerClassName
          )}
        >
          <span
            className={cn(
              "truncate",
              !selectedOption && "text-text-muted"
            )}
          >
            {selectedOption?.triggerLabel ?? selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border border-border bg-card p-0 shadow-xl outline-none animate-scale-in overflow-hidden"
        >
          <div className="border-b border-border-default p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 border-0 bg-bg-main pl-9 shadow-none"
              />
            </div>
          </div>

          <div id="searchable-select-listbox" role="listbox" className="max-h-72 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm font-medium text-text-muted">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-bg-main",
                      isSelected && "bg-bg-main"
                    )}
                    onClick={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{option.label}</p>
                      {option.description ? (
                        <p className="truncate text-xs font-medium text-text-muted">
                          {option.description}
                        </p>
                      ) : null}
                    </div>
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 text-accent-primary",
                        !isSelected && "opacity-0"
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
