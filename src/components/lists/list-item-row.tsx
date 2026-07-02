"use client";

import Link from "next/link";
import Image from "next/image";
import { GripVertical, Trash2, Trophy, CheckCircle2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GameListItem } from "@/lib/api";
import { ProgressBar } from "@/components/lists/progress-bar";
import { AchievementBadge } from "@/components/lists/achievement-badge";

interface ListItemRowProps {
  item: GameListItem;
  isOwner: boolean;
  isPlayingList: boolean;
  dragEnabled: boolean;
  syncingAchievements: boolean;
  hasSteam: boolean;
  onRemove: (gameId: string) => void;
  onProgressEditClick: () => void;
  onSyncAchievements: () => void;
  onCompleteClick: () => void;
}

export function ListItemRow({
  item,
  isOwner,
  isPlayingList,
  dragEnabled,
  syncingAchievements,
  hasSteam,
  onRemove,
  onProgressEditClick,
  onSyncAchievements,
  onCompleteClick,
}: ListItemRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isAt100 = isPlayingList && (item.progressPct ?? 0) === 100;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card rounded-lg border p-4 transition-colors motion-reduce:transition-none ${
        isAt100 ? "border-brand-teal/30" : "border-brand-purple/15 hover:border-brand-purple/25"
      }`}
    >
      <div className="flex items-start gap-4">
        {dragEnabled && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="mt-1 text-foreground/40 hover:text-foreground/70 cursor-grab active:cursor-grabbing shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        <div className="w-12 h-16 relative rounded overflow-hidden bg-brand-purple/10 shrink-0 border border-brand-purple/10">
          {item.game?.coverImage ? (
            <Image src={item.game.coverImage} alt={item.game.title ?? ""} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-foreground/60">
              No art
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/games/${item.game?.slug}`}
                className="text-[14px] font-medium text-foreground hover:text-brand-purple transition-colors motion-reduce:transition-none line-clamp-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.game?.title}
              </Link>
              {item.notes && (
                <p className="text-[12px] text-foreground/60 mt-0.5 line-clamp-2">{item.notes}</p>
              )}
            </div>

            {isOwner && (
              <button
                className="p-1.5 shrink-0 text-foreground/40 hover:text-brand-red hover:bg-brand-red/5 rounded transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onRemove(item.gameId)}
                aria-label="Remove game"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {isPlayingList && (
            <div className="mt-3 space-y-1.5">
              <ProgressBar value={item.progressPct} editable={isOwner} onClick={onProgressEditClick} />
              {item.progressNote && (
                <p className="text-[12px] text-foreground/60 italic">{item.progressNote}</p>
              )}

              <AchievementBadge
                achievements={item.steamAchievements}
                isSyncing={syncingAchievements}
                onSync={onSyncAchievements}
                hasSteam={hasSteam}
              />

              {isAt100 && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-brand-teal/10 border border-brand-teal/20 rounded-lg text-[12px] text-brand-teal">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">
                    You&apos;re at 100% — ready to mark this complete?
                  </span>
                  <button
                    onClick={onCompleteClick}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded border border-brand-teal/30 hover:bg-brand-teal/20 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trophy className="h-3 w-3" aria-hidden="true" />
                    Complete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
