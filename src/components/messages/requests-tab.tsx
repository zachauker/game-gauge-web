"use client";

import { useMessageRequests } from "@/hooks/useMessageRequests";

interface RequestsTabProps {
  onAccepted: (conversationId: string) => void;
}

export function RequestsTab({ onAccepted }: RequestsTabProps) {
  const { requests, loading, accept, decline } = useMessageRequests();

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return <p className="text-sm text-foreground/40 text-center py-12 px-4">No pending requests</p>;
  }

  return (
    <div>
      {requests.map((request) => (
        <div key={request.id} className="px-4 py-3 border-b border-border">
          <p className="text-sm text-foreground mb-2">
            {request.isGroup
              ? `Group invite: ${request.name || "Unnamed group"}`
              : (request.otherParticipants[0]?.username ?? "Unknown user")}
          </p>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => void accept(request.id).then(() => onAccepted(request.id))}
              className="px-3 py-1 rounded-md bg-brand-purple text-foreground font-medium"
            >
              Accept
            </button>
            <button
              onClick={() => void decline(request.id)}
              className="px-3 py-1 rounded-md text-foreground/50 hover:text-foreground/80"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
