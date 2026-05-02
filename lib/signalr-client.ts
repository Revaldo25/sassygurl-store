/**
 * SignalR Client for SassyGurl Real-Time Dashboard
 * 
 * Connects to the ASP.NET Core NotificationHub via WebSocket.
 * Provides type-safe event handlers for transaction updates.
 * 
 * Usage:
 *   const connection = createDashboardConnection(authToken);
 *   connection.on("TransactionUpdated", (data) => { ... });
 *   await connection.start();
 */

import * as signalR from "@microsoft/signalr";

const HUB_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:5000";

// ── SignalR Payload Types (mirrors C# records) ──────────────────────────────

export type TransactionUpdatePayload = {
  transactionId: string;
  invoiceId: string;
  gameName: string;
  productName: string;
  targetId: string;
  amount: number;
  paymentStatus: string;
  orderStatus: string;
  providerRef: string | null;
  updatedAt: string;
};

export type ProviderStatusPayload = {
  providerName: string;
  isActive: boolean;
  successRate: number;
  avgLatencyMs: number;
  checkedAt: string;
};

// ── Hub Event Names (type-safe) ─────────────────────────────────────────────

export type HubEvents = {
  TransactionUpdated: (payload: TransactionUpdatePayload) => void;
  MyOrderUpdated: (payload: TransactionUpdatePayload) => void;
  ProviderStatusChanged: (payload: ProviderStatusPayload) => void;
};

// ── Connection Factory ──────────────────────────────────────────────────────

let _connection: signalR.HubConnection | null = null;

export function createDashboardConnection(
  accessToken?: string
): signalR.HubConnection {
  // Reuse existing connection if it exists and is connected
  if (_connection && _connection.state === signalR.HubConnectionState.Connected) {
    return _connection;
  }

  const builder = new signalR.HubConnectionBuilder()
    .withUrl(`${HUB_URL}/hubs/notifications`, {
      accessTokenFactory: () => accessToken ?? "",
      transport: signalR.HttpTransportType.WebSockets,
      skipNegotiation: true,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Exponential backoff
    .configureLogging(signalR.LogLevel.Warning);

  _connection = builder.build();

  _connection.onreconnecting(() => {
    console.log("[SignalR] Reconnecting...");
  });

  _connection.onreconnected(() => {
    console.log("[SignalR] Reconnected.");
  });

  _connection.onclose((error) => {
    console.log("[SignalR] Connection closed.", error?.message);
    _connection = null;
  });

  return _connection;
}

/**
 * Disconnect and clean up the SignalR connection.
 */
export async function disconnectDashboard(): Promise<void> {
  if (_connection) {
    await _connection.stop();
    _connection = null;
  }
}
