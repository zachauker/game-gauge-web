"use client";

import Link from "next/link";
import Image from "next/image";
import { FollowButton } from "@/components/social/follow-button";
import { FollowUser } from "@/lib/social";

interface FollowUserRowProps {
  user: FollowUser;
  showFollowButton: boolean;
}

export function FollowUserRow({ user, showFollowButton }: FollowUserRowProps) {
  const initials = user.username.substring(0, 2).toUpperCase();

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-brand-purple/10">
      <Link href={`/users/${user.username}`} className="shrink-0">
        <div className="h-9 w-9 rounded-full bg-brand-purple/25 border border-brand-purple/20 flex items-center justify-center overflow-hidden">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.username}
              width={36}
              height={36}
              className="object-cover"
            />
          ) : (
            <span className="text-[12px] font-medium text-foreground/50">
              {initials}
            </span>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/users/${user.username}`}>
          <p className="text-[13px] font-medium text-foreground/80 hover:text-foreground truncate transition-colors">
            {user.username}
          </p>
        </Link>
        {user.bio && (
          <p className="text-[11px] text-foreground/35 truncate mt-0.5">
            {user.bio}
          </p>
        )}
      </div>

      {showFollowButton && (
        <FollowButton
          username={user.username}
          initialIsFollowing={user.isFollowing ?? false}
          initialFollowerCount={0}
          size="sm"
        />
      )}
    </div>
  );
}
