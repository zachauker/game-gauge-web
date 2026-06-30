'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

export type SortOption = 'top-rated' | 'trending' | 'release-date' | 'a-z';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'top-rated', label: 'Top Rated' },
  { value: 'trending', label: 'Trending' },
  { value: 'release-date', label: 'Release Date' },
  { value: 'a-z', label: 'A–Z' },
];

export const GENRE_OPTIONS = [
  'Point-and-click', 'Fighting', 'Shooter', 'Music', 'Platform',
  'Puzzle', 'Racing', 'Real Time Strategy (RTS)', 'Role-playing (RPG)',
  'Simulator', 'Sport', 'Strategy', 'Turn-based strategy (TBS)',
  'Tactical', "Hack and slash/Beat 'em up", 'Quiz/Trivia',
  'Card & Board Game', 'MOBA', 'Adventure', 'Indie', 'Arcade', 'Visual Novel',
];

export const PLATFORM_OPTIONS = [
  'PC', 'PlayStation 5', 'PlayStation 4', 'Xbox Series X|S',
  'Xbox One', 'Nintendo Switch', 'iOS', 'Android',
];

interface FilterChipsProps {
  activeGenre: string | null;
  activePlatform: string | null;
  activeSort: SortOption;
  searchMode: boolean;
  onGenreChange: (genre: string | null) => void;
  onPlatformChange: (platform: string | null) => void;
  onSortChange: (sort: SortOption) => void;
}

function ChipDropdown({
  label,
  value,
  options,
  disabled,
  onSelect,
  onClear,
}: {
  label: string;
  value: string | null;
  options: string[];
  disabled?: boolean;
  onSelect: (v: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (disabled) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-white/10 text-white/25 cursor-not-allowed select-none"
        title={`${label} filter not available in search mode`}
      >
        <span>{label}</span>
        <ChevronDown className="h-3 w-3" />
      </div>
    );
  }

  if (value) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-brand-amber/50 bg-brand-amber/15 text-brand-amber">
        <span>{value}</span>
        <button
          type="button"
          onClick={onClear}
          className="hover:text-white transition-colors"
          aria-label={`Remove ${label} filter`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-brand-purple/35 bg-brand-purple/15 text-brand-purple-light hover:border-brand-purple/60 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[180px] max-h-64 overflow-y-auto">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-brand-purple/20 hover:text-white transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SortChip({
  value,
  disabled,
  onChange,
}: {
  value: SortOption;
  disabled?: boolean;
  onChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const currentLabel = SORT_OPTIONS.find(o => o.value === value)?.label ?? 'Sort';

  if (disabled) {
    return (
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-white/10 text-white/25 cursor-not-allowed select-none"
        title="Sort not available in search mode"
      >
        <span>Sort: {currentLabel}</span>
        <ChevronDown className="h-3 w-3" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-brand-purple/35 bg-brand-purple/15 text-brand-purple-light hover:border-brand-purple/60 transition-colors"
      >
        <span>Sort: {currentLabel}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
          {SORT_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                option.value === value
                  ? 'text-brand-amber bg-brand-amber/10'
                  : 'text-white/80 hover:bg-brand-purple/20 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterChips({
  activeGenre,
  activePlatform,
  activeSort,
  searchMode,
  onGenreChange,
  onPlatformChange,
  onSortChange,
}: FilterChipsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <ChipDropdown
        label="Genre"
        value={activeGenre}
        options={GENRE_OPTIONS}
        onSelect={onGenreChange}
        onClear={() => onGenreChange(null)}
      />
      <ChipDropdown
        label="Platform"
        value={activePlatform}
        options={PLATFORM_OPTIONS}
        disabled={searchMode}
        onSelect={onPlatformChange}
        onClear={() => onPlatformChange(null)}
      />
      <SortChip
        value={activeSort}
        disabled={searchMode}
        onChange={onSortChange}
      />
    </div>
  );
}
