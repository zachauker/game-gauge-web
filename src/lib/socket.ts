import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

let sharedSocket: Socket | null = null;

/**
 * Returns a shared socket.io client for the given auth token, creating a
 * fresh connection if none exists or the previous one disconnected.
 */
export function getSocket(token: string): Socket {
  if (sharedSocket && sharedSocket.connected) return sharedSocket;
  if (sharedSocket) sharedSocket.disconnect();

  sharedSocket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
  });
  return sharedSocket;
}
