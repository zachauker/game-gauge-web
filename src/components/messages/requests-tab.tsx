"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMessageRequests } from "@/hooks/useMessageRequests";

interface RequestsTabProps {
  onAccepted: (conversationId: string) => void;
}

export function RequestsTab({ onAccepted }: RequestsTabProps) {
  const { requests, loading, accept, decline } = useMessageRequests();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await accept(id);
      onAccepted(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't accept this request");
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    try {
      await decline(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't decline this request");
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 rounded-full border-2 border-brand-purple/20 border-t-brand-purple animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return <p className="text-sm text-foreground/60 text-center py-12 px-4">No pending requests</p>;
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
              onClick={() => void handleAccept(request.id)}
              disabled={processingId === request.id}
              className="px-3 py-1 rounded-md bg-brand-purple text-foreground font-medium hover:bg-brand-purple/80 transition-colors motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Accept
            </button>
            <button
              onClick={() => void handleDecline(request.id)}
              disabled={processingId === request.id}
              className="px-3 py-1 rounded-md text-foreground/60 hover:text-foreground/80 transition-colors motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
