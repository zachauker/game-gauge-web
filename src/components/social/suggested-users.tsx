"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Sparkles } from "lucide-react";
import { FollowButton } from "@/components/social/follow-button";
import { FollowUser, getSuggestedUsers } from "@/lib/social";

export function SuggestedUsers() {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSuggestedUsers(5)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && users.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggested
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Link
                  href={`/users/${u.username}`}
                  className="flex flex-1 items-center gap-2.5 min-w-0"
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {u.avatar && (
                      <AvatarImage src={u.avatar} alt={u.username} />
                    )}
                    <AvatarFallback className="text-xs">
                      {u.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-tight">
                      {u.username}
                    </p>
                    {u.bio && (
                      <p className="truncate text-xs text-muted-foreground">
                        {u.bio}
                      </p>
                    )}
                  </div>
                </Link>
                <FollowButton
                  username={u.username}
                  initialIsFollowing={false}
                  initialFollowerCount={0}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
