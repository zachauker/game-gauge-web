"use client";

import { StarRating } from "./star-rating";
import { Star, Users } from "lucide-react";
import { RatingStats as RatingStatsType } from "@/lib/api";

interface RatingStatsProps {
  stats: RatingStatsType;
}

export function RatingStats({ stats }: RatingStatsProps) {
  const { averageScore, totalRatings, distribution } = stats;

  // Calculate percentage for each rating
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Average Rating Section */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Average Rating
        </h4>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">
            {averageScore.toFixed(1)}
          </div>
          <div className="flex-1">
            <StarRating
              value={Math.round(averageScore)}
              onChange={() => {}}
              max={10}
              size="sm"
              readonly
              showValue={false}
            />
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
            </p>
          </div>
        </div>
      </div>

      {/* Distribution Section */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Rating Distribution</h4>
        <div className="space-y-2">
          {distribution
            .sort((a, b) => b.score - a.score)
            .map((item) => {
              const percentage = getPercentage(item.count);
              
              return (
                <div key={item.score} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-5">
                    {item.score}
                  </span>
                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {item.count}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
