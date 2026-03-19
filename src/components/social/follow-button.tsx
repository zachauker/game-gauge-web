"use client";

import { useFollow } from "@/hooks/useFollow";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  username: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  /** Called after a successful toggle with new isFollowing state */
  onToggle?: (isFollowing: boolean) => void;
  size?: "sm" | "default";
  className?: string;
}

export function FollowButton({
  username,
  initialIsFollowing,
  initialFollowerCount,
  onToggle,
  size = "default",
  className,
}: FollowButtonProps) {
  const { isFollowing, isLoading, toggle } = useFollow({
    username,
    initialIsFollowing,
    initialFollowerCount,
  });

  const handleClick = async () => {
    const prev = isFollowing;
    await toggle();
    onToggle?.(!prev);
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "min-w-[100px] transition-all",
        isFollowing && "hover:border-destructive hover:text-destructive",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="mr-1.5 h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
