"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Settings, Calendar, MoreHorizontal, Ban } from "lucide-react";
import { FollowButton } from "@/components/social/follow-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { blockUser, unblockUser } from "@/lib/blocks";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    avatar: string | null;
    createdAt: string;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  followerCount: number;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  followerCount,
}: ProfileHeaderProps) {
  const displayName =
    profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : profile.username;
  const initials = profile.username.substring(0, 2).toUpperCase();
  const joinYear = new Date(profile.createdAt).getFullYear();
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const handleToggleBlock = async () => {
    setIsBlocking(true);
    try {
      if (isBlocked) {
        await unblockUser(profile.username);
        setIsBlocked(false);
        toast.success(`Unblocked ${profile.username}`);
      } else {
        await blockUser(profile.username);
        setIsBlocked(true);
        toast.success(`Blocked ${profile.username}`);
      }
    } catch {
      toast.error(isBlocked ? "Failed to unblock user" : "Failed to block user");
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <div className="flex items-start gap-5 mb-8">
      {/* Avatar */}
      <div className="h-20 w-20 rounded-full bg-brand-purple/25 border-2 border-brand-purple/20 flex items-center justify-center shrink-0 overflow-hidden">
        {profile.avatar ? (
          <Image
            src={profile.avatar}
            alt={displayName}
            width={80}
            height={80}
            className="object-cover"
          />
        ) : (
          <span className="text-[22px] font-medium text-foreground/50">
            {initials}
          </span>
        )}
      </div>

      {/* Identity */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-medium tracking-tight text-foreground leading-tight">
              {displayName}
            </h1>
            {profile.firstName && profile.lastName && (
              <p className="text-[13px] text-foreground/60 mt-0.5">
                @{profile.username}
              </p>
            )}
          </div>

          {isOwnProfile ? (
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-[12px] text-foreground/60 hover:text-foreground/80 bg-card border border-brand-purple/20 hover:border-brand-purple/35 rounded-lg px-3 py-1.5 transition-colors motion-reduce:transition-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              Edit profile
            </Link>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <FollowButton
                username={profile.username}
                initialIsFollowing={isFollowing}
                initialFollowerCount={followerCount}
                size="sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="More options"
                    disabled={isBlocking}
                    className="p-2 rounded-lg border border-brand-purple/20 hover:border-brand-purple/40 text-foreground/60 hover:text-foreground transition-colors motion-reduce:transition-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border-brand-purple/20">
                  <DropdownMenuItem
                    onClick={() => void handleToggleBlock()}
                    className="cursor-pointer gap-2 text-brand-red focus:text-brand-red focus:bg-brand-red/5"
                  >
                    <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                    {isBlocked ? "Unblock user" : "Block user"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {profile.bio && (
          <p className="text-[13px] text-foreground/50 leading-relaxed mt-2 max-w-lg">
            {profile.bio}
          </p>
        )}

        <p className="flex items-center gap-1.5 text-[11px] text-foreground/60 mt-2">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          Member since {joinYear}
        </p>
      </div>
    </div>
  );
}
