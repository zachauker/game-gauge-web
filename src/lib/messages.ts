import { api } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MessageType = "TEXT" | "GAME_SHARE" | "LIST_SHARE" | "REVIEW_SHARE" | "ACTIVITY_SHARE";

export interface ConversationParticipantUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  sender: ConversationParticipantUser;
  game: { id: string; title: string; slug: string; coverImage: string | null } | null;
  list: { id: string; name: string; isPublic: boolean; _count: { items: number } } | null;
  review: {
    id: string;
    content: string;
    game: { title: string; slug: string };
    rating: { score: number } | null;
  } | null;
  activityEvent: {
    id: string;
    type: string;
    meta: Record<string, unknown> | null;
    user: { username: string };
    game: { title: string; slug: string } | null;
  } | null;
}

export interface ConversationSummary {
  id: string;
  isGroup: boolean;
  name: string | null;
  lastMessageAt: string;
  otherParticipants: ConversationParticipantUser[];
  lastMessage: Message | null;
  unread: boolean;
}

export interface ConversationDetail {
  id: string;
  isGroup: boolean;
  name: string | null;
  creatorId: string | null;
  participants: Array<{
    userId: string;
    status: "ACCEPTED" | "PENDING" | "DECLINED";
    user: ConversationParticipantUser;
  }>;
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatar: string | null;
}

// ─── Conversations ─────────────────────────────────────────────────────────────

export async function fetchConversations(
  page = 1,
  limit = 20
): Promise<{ conversations: ConversationSummary[]; pagination: { page: number; limit: number; total: number; hasMore: boolean } }> {
  const { data } = await api.get("/conversations", { params: { page, limit } });
  return data.data;
}

export async function fetchRequests(): Promise<ConversationSummary[]> {
  const { data } = await api.get("/conversations/requests");
  return data.data;
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get("/conversations/unread-count");
  return data.data.count;
}

export async function createConversation(
  participantUsernames: string[],
  isGroup = false,
  name?: string
): Promise<ConversationDetail> {
  const { data } = await api.post("/conversations", { participantUsernames, isGroup, name });
  return data.data;
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  const { data } = await api.get(`/conversations/${id}`);
  return data.data;
}

export async function acceptConversation(id: string): Promise<void> {
  await api.post(`/conversations/${id}/accept`);
}

export async function declineConversation(id: string): Promise<void> {
  await api.post(`/conversations/${id}/decline`);
}

export async function archiveOrLeaveConversation(id: string): Promise<void> {
  await api.delete(`/conversations/${id}`);
}

export async function renameConversation(id: string, name: string): Promise<void> {
  await api.patch(`/conversations/${id}`, { name });
}

export async function addConversationMember(id: string, username: string): Promise<void> {
  await api.post(`/conversations/${id}/members/${username}`);
}

export async function removeConversationMember(id: string, userId: string): Promise<void> {
  await api.delete(`/conversations/${id}/members/${userId}`);
}

// ─── Messages ──────────────────────────────────────────────────────────────────

export async function fetchMessages(conversationId: string, before?: string): Promise<Message[]> {
  const { data } = await api.get(`/conversations/${conversationId}/messages`, {
    params: before ? { before } : {},
  });
  return data.data;
}

export async function sendMessage(
  conversationId: string,
  input: { type: MessageType; content?: string; entityId?: string }
): Promise<Message> {
  const { data } = await api.post(`/conversations/${conversationId}/messages`, input);
  return data.data;
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  content: string
): Promise<Message> {
  const { data } = await api.patch(
    `/conversations/${conversationId}/messages/${messageId}`,
    { content }
  );
  return data.data;
}

export async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}/messages/${messageId}`);
}

// ─── User search (for picking message recipients) ──────────────────────────────

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!query.trim()) return [];
  const { data } = await api.get("/users/search", { params: { q: query } });
  return data.data;
}
