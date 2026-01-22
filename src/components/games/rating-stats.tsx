"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "./star-rating";
import { Star, Users } from "lucide-react";
import { RatingStats as RatingStatsType } from "@/lib/api";

interface RatingStatsProps {
  stats: RatingStatsType;
  userRating?: number;
}

export function RatingStats({ stats, userRating }: RatingStatsProps) {
  const { averageScore, totalRatings, distribution } = stats;

  // Calculate percentage for each rating
  const getPercentage = (count: number) => {
    if (totalRatings === 0) return 0;
    return Math.round((count / totalRatings) * 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Average Rating Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Average Rating
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">
                {averageScore.toFixed(1)}
              </div>
              <div className="flex-1">
                <StarRating
                  value={Math.round(averageScore)}
                  onChange={() => {}}
                  max={10}
                  size="md"
                  readonly
                  showValue={false}
                />
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {totalRatings} {totalRatings === 1 ? "rating" : "ratings"}
                </p>
              </div>
            </div>

            {userRating && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Your Rating</p>
                <StarRating
                  value={userRating}
                  onChange={() => {}}
                  max={10}
                  size="sm"
                  readonly
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Card */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {distribution
              .sort((a, b) => b.score - a.score)
              .map((item) => {
                const percentage = getPercentage(item.count);
                
                return (
                  <div key={item.score} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-6">
                      {item.score}
                    </span>
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {item.count}
                    </span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
