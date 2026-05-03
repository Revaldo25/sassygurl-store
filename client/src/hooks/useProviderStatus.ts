import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface ProviderStatus {
  id: number;
  providerName: string;
  isOnline: boolean;
  statusMessage: string | null;
  lastCheckedAt: Date;
}

export function useProviderStatus() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.io server
    const newSocket = io(window.location.origin, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Connected to server");
      setIsConnected(true);
      newSocket.emit("subscribe:provider-status");
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("provider-status:update", (data: any) => {
      console.log("[Socket] Received provider status update:", data);
      setProviders(data.providers);
    });

    newSocket.on("error", (error: any) => {
      console.error("[Socket] Error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("unsubscribe:provider-status");
      newSocket.disconnect();
    };
  }, []);

  const updateProviderStatus = (
    providerName: string,
    isOnline: boolean,
    statusMessage?: string
  ) => {
    if (socket) {
      socket.emit("update:provider-status", {
        providerName,
        isOnline,
        statusMessage,
      });
    }
  };

  const getProviderStatus = (providerName: string): ProviderStatus | undefined => {
    return providers.find((p) => p.providerName === providerName);
  };

  return {
    providers,
    isConnected,
    updateProviderStatus,
    getProviderStatus,
  };
}
