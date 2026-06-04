"use client";

import { Star, Users } from "lucide-react";
import { RatingStats as RatingStatsType } from "@/lib/api";

interface RatingStatsProps {
  stats: RatingStatsType;
}

export function RatingStats({ stats }: RatingStatsProps) {
  const { averageScore, totalRatings, distribution } = stats;

  const getPercentage = (count: number) =>
    totalRatings === 0 ? 0 : Math.round((count / totalRatings) * 100);

  const sorted = [...distribution].sort((a, b) => b.score - a.score);
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-5">
      {/* Average + total */}
      <div className="flex items-baseline gap-3">
        <span className="text-[36px] font-medium text-foreground/90 leading-none tabular-nums">
          {averageScore.toFixed(1)}
        </span>
        <div>
          <div className="flex items-center gap-1 mb-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
              <Star
                key={s}
                className={`h-3 w-3 ${
                  s <= Math.round(averageScore)
                    ? "fill-brand-amber text-brand-amber"
                    : "text-foreground/10"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] text-foreground/35 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {totalRatings.toLocaleString()}{" "}
            {totalRatings === 1 ? "rating" : "ratings"}
          </p>
        </div>
      </div>

      {/* Distribution bars */}
      <div className="space-y-1.5">
        {sorted.map((item) => {
          const pct = getPercentage(item.count);
          const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
          return (
            <div key={item.score} className="flex items-center gap-2.5">
              <span className="text-[11px] text-foreground/35 w-4 text-right tabular-nums shrink-0">
                {item.score}
              </span>
              <div className="flex-1 h-3 bg-brand-purple/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-amber/60 rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="text-[11px] text-foreground/25 w-8 text-right tabular-nums shrink-0">
                {pct > 0 ? `${pct}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}