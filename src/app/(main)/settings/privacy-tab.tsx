"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, UserX } from "lucide-react";
import { fetchBlockedUsers, unblockUser, BlockedUser } from "@/lib/blocks";
import { toast } from "sonner";

export default function PrivacySettingsTab() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBlockedUsers()
      .then(setBlockedUsers)
      .catch(() => toast.error("Failed to load blocked users"))
      .finally(() => setLoading(false));
  }, []);

  const handleUnblock = async (user: BlockedUser) => {
    setUnblockingId(user.id);
    try {
      await unblockUser(user.username);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success(`Unblocked ${user.username}`);
    } catch {
      toast.error("Failed to unblock user");
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked Users</CardTitle>
        <CardDescription>
          Blocked users cannot message you, and any existing conversation with them is hidden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm font-medium">{user.username}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleUnblock(user)}
                  disabled={unblockingId === user.id}
                >
                  {unblockingId === user.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserX className="mr-1.5 h-3.5 w-3.5" />
                      Unblock
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
