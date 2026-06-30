"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, ArrowUp, ArrowDown, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortBy, SortDir, ListStatusFilter } from "@/lib/list-sort-filter";

export const SORT_FIELD_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "custom", label: "Custom order" },
  { value: "title", label: "Title" },
  { value: "dateAdded", label: "Date added" },
  { value: "progress", label: "Progress %" },
  { value: "releaseDate", label: "Release date" },
  { value: "rating", label: "Your rating" },
];

const STATUS_OPTIONS: { value: ListStatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

function MultiSelectChip({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  if (options.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
          selected.length > 0
            ? "border-brand-purple/50 bg-brand-purple/15 text-brand-purple"
            : "border-brand-purple/20 text-foreground/50 hover:border-brand-purple/40"
        }`}
      >
        <span>
          {label}
          {selected.length > 0 ? ` (${selected.length})` : ""}
        </span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-brand-purple/15 rounded-lg shadow-xl overflow-hidden min-w-[180px] max-h-64 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`w-full text-left px-4 py-2 text-[12px] transition-colors flex items-center justify-between ${
                selected.includes(option)
                  ? "text-brand-purple bg-brand-purple/10"
                  : "text-foreground/70 hover:bg-brand-purple/10 hover:text-foreground"
              }`}
            >
              <span>{option}</span>
              {selected.includes(option) && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortBy;
  sortDir: SortDir;
  onSortChange: (sortBy: SortBy, sortDir: SortDir) => void;
  availableGenres: string[];
  availablePlatforms: string[];
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  showStatusFilter: boolean;
  status: ListStatusFilter;
  onStatusChange: (status: ListStatusFilter) => void;
}

export function ListToolbar({
  search,
  onSearchChange,
  sortBy,
  sortDir,
  onSortChange,
  availableGenres,
  availablePlatforms,
  selectedGenres,
  onGenresChange,
  selectedPlatforms,
  onPlatformsChange,
  showStatusFilter,
  status,
  onStatusChange,
}: ListToolbarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap p-3 border border-brand-purple/15 rounded-lg mb-6">
      <div className="relative flex-1 min-w-[160px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/30" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search this list..."
          className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-background border border-brand-purple/20 rounded-md focus:outline-none focus:border-brand-purple/50 text-foreground placeholder:text-foreground/30"
        />
      </div>

      <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortBy, sortDir)}>
        <SelectTrigger className="w-auto h-auto py-1.5 px-3 text-[12px] rounded-full border-brand-purple/20 gap-1.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_FIELD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sortBy !== "custom" && (
        <button
          type="button"
          onClick={() => onSortChange(sortBy, sortDir === "asc" ? "desc" : "asc")}
          className="p-1.5 rounded-full border border-brand-purple/20 text-foreground/50 hover:text-foreground hover:border-brand-purple/40 transition-colors"
          aria-label={sortDir === "asc" ? "Sort descending" : "Sort ascending"}
        >
          {sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" />
          )}
        </button>
      )}

      <MultiSelectChip
        label="Genre"
        options={availableGenres}
        selected={selectedGenres}
        onChange={onGenresChange}
      />
      <MultiSelectChip
        label="Platform"
        options={availablePlatforms}
        selected={selectedPlatforms}
        onChange={onPlatformsChange}
      />

      {showStatusFilter && (
        <Select value={status} onValueChange={(value) => onStatusChange(value as ListStatusFilter)}>
          <SelectTrigger className="w-auto h-auto py-1.5 px-3 text-[12px] rounded-full border-brand-purple/20 gap-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
