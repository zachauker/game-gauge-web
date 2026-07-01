import { api } from "@/lib/api";

export interface BlockedUser {
  id: string;
  username: string;
  avatar: string | null;
}

export async function blockUser(username: string): Promise<void> {
  await api.post(`/users/${username}/block`);
}

export async function unblockUser(username: string): Promise<void> {
  await api.delete(`/users/${username}/block`);
}

export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  const { data } = await api.get("/users/me/blocks");
  return data.data;
}
