"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
}

export function StarRating({
  value,
  onChange,
  max = 10,
  size = "md",
  readonly = false,
  showValue = true,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((rating) => {
          const isFilled = (hover || value) >= rating;
          
          return (
            <button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => !readonly && setHover(rating)}
              onMouseLeave={() => !readonly && setHover(0)}
              disabled={readonly}
              className={cn(
                "transition-all",
                !readonly && "cursor-pointer hover:scale-110",
                readonly && "cursor-default"
              )}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "transition-colors",
                  isFilled
                    ? "fill-yellow-500 text-yellow-500"
                    : "fill-muted text-muted-foreground"
                )}
              />
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-lg font-semibold min-w-[3ch]">
          {hover || value || 0}/{max}
        </span>
      )}
    </div>
  );
}
