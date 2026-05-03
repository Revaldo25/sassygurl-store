import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { getDb } from "./db";
import { eq } from "drizzle-orm";
import { providerStatus } from "../drizzle/schema";

export class SocketService {
  private io: SocketIOServer;
  private connectedClients = new Set<string>();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.setupEventHandlers();
    this.startStatusPolling();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);

      // Send initial provider status
      this.sendProviderStatus(socket);

      // Subscribe to provider status updates
      socket.on("subscribe:provider-status", () => {
        socket.join("provider-status-room");
        console.log(`[Socket] Client ${socket.id} subscribed to provider status`);
      });

      // Unsubscribe from provider status updates
      socket.on("unsubscribe:provider-status", () => {
        socket.leave("provider-status-room");
        console.log(`[Socket] Client ${socket.id} unsubscribed from provider status`);
      });

      // Handle manual status update (admin only)
      socket.on("update:provider-status", async (data: any) => {
        await this.updateProviderStatus(data);
        this.broadcastProviderStatus();
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on("error", (error: any) => {
        console.error(`[Socket] Error from ${socket.id}:`, error);
      });
    });
  }

  private async sendProviderStatus(socket: Socket) {
    try {
      const db = await getDb();
      if (!db) return;

      const statuses = await db.select().from(providerStatus);
      socket.emit("provider-status:update", {
        providers: statuses,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("[Socket] Error sending provider status:", error);
    }
  }

  private async broadcastProviderStatus() {
    try {
      const db = await getDb();
      if (!db) return;

      const statuses = await db.select().from(providerStatus);
      this.io.to("provider-status-room").emit("provider-status:update", {
        providers: statuses,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("[Socket] Error broadcasting provider status:", error);
    }
  }

  private async updateProviderStatus(data: {
    providerName: string;
    isOnline: boolean;
    statusMessage?: string;
  }) {
    try {
      const db = await getDb();
      if (!db) return;

      await db
        .update(providerStatus)
        .set({
          isOnline: data.isOnline,
          statusMessage: data.statusMessage,
          lastCheckedAt: new Date(),
        })
        .where(eq(providerStatus.providerName, data.providerName));

      console.log(`[Socket] Updated provider status: ${data.providerName}`);
    } catch (error) {
      console.error("[Socket] Error updating provider status:", error);
    }
  }

  private startStatusPolling() {
    // Poll provider status every 30 seconds
    setInterval(async () => {
      try {
        const db = await getDb();
        if (!db) return;

        // In production, this would call actual provider APIs
        // For now, we'll just simulate occasional status changes
        const statuses = await db.select().from(providerStatus);

        // Randomly toggle a provider's status for demo purposes
        if (Math.random() > 0.95 && statuses.length > 0) {
          const randomProvider = statuses[Math.floor(Math.random() * statuses.length)];
          await this.updateProviderStatus({
            providerName: randomProvider.providerName,
            isOnline: !randomProvider.isOnline,
            statusMessage: !randomProvider.isOnline ? "Online" : "Maintenance",
          });
          this.broadcastProviderStatus();
        }
      } catch (error) {
        console.error("[Socket] Error in status polling:", error);
      }
    }, 30000); // 30 seconds
  }

  public getIO() {
    return this.io;
  }

  public getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }

  public broadcastToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
  }
}
