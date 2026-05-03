import { Server as HTTPServer } from "http";
import { SocketService } from "../socketService";

let socketService: SocketService | null = null;

export function initializeSocket(httpServer: HTTPServer): SocketService {
  if (!socketService) {
    socketService = new SocketService(httpServer);
    console.log("[Socket] Initialized Socket.io service");
  }
  return socketService;
}

export function getSocketService(): SocketService | null {
  return socketService;
}

export function broadcastProviderStatusUpdate(data: any) {
  if (socketService) {
    socketService.broadcastToRoom("provider-status-room", "provider-status:update", data);
  }
}
