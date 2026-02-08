import {
  Server as HttpServer,
  IncomingHttpHeaders,
  IncomingMessage,
} from "node:http";

import { WebSocketServer, WebSocket } from "ws";

interface SubscriptionMessage {
  type: "subscribe" | "unsubscribe";
  runId: string;
}

interface WsHubOptions {
  apiToken?: string;
}

export class WsHub {
  private readonly wss: WebSocketServer;
  private readonly apiToken?: string;
  private subscriptions: Map<string, Set<WebSocket>> = new Map();

  private pruneRunBucket(runId: string): void {
    const bucket = this.subscriptions.get(runId);
    if (!bucket || bucket.size > 0) return;
    this.subscriptions.delete(runId);
  }

  constructor(server: HttpServer, opts?: WsHubOptions) {
    this.apiToken = String(opts?.apiToken || "").trim() || undefined;
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket, request) => {
      const authorized = this.isAuthorizedRequest(request);
      if (!authorized) {
        this.rejectUnauthorizedSocket(socket);
        return;
      }
      this.handleConnection(socket, authorized);
    });
  }

  broadcastRunEvent(runId: string, payload: unknown): void {
    const sockets = this.subscriptions.get(runId);
    if (!sockets || sockets.size === 0) return;

    const envelope = JSON.stringify({
      type: "run.event",
      runId,
      payload,
    });

    for (const socket of sockets) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(envelope);
      }
    }
  }

  close(): void {
    this.wss.close();
    this.subscriptions.clear();
  }

  private normalizeHeaderValue(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
      return String(value[0] || "").trim();
    }
    return String(value || "").trim();
  }

  private extractTokenFromHeaders(headers: IncomingHttpHeaders): string {
    const authHeader = this.normalizeHeaderValue(headers.authorization);
    if (authHeader) {
      const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearer?.[1]) {
        return bearer[1].trim();
      }
    }
    const apiKey = this.normalizeHeaderValue(headers["x-api-key"]);
    return apiKey;
  }

  private extractTokenFromQuery(request: IncomingMessage): string {
    const rawUrl = String(request.url || "").trim();
    if (!rawUrl) return "";
    try {
      const parsed = new URL(rawUrl, "http://localhost");
      return String(
        parsed.searchParams.get("token") ||
          parsed.searchParams.get("apiKey") ||
          parsed.searchParams.get("api_key") ||
          "",
      ).trim();
    } catch {
      return "";
    }
  }

  private isAuthorizedRequest(request: IncomingMessage): boolean {
    if (!this.apiToken) return true;
    const token = this.extractTokenFromHeaders(request.headers) || this.extractTokenFromQuery(request);
    return Boolean(token) && token === this.apiToken;
  }

  private rejectUnauthorizedSocket(socket: WebSocket): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "error",
          error: "Unauthorized",
        }),
      );
    }
    socket.close(4401, "Unauthorized");
  }

  private handleConnection(socket: WebSocket, authorized: boolean): void {
    const subscribedRuns = new Set<string>();

    socket.on("message", (buf) => {
      let data: SubscriptionMessage;
      try {
        data = JSON.parse(buf.toString()) as SubscriptionMessage;
      } catch {
        return;
      }

      if (!authorized) {
        this.rejectUnauthorizedSocket(socket);
        return;
      }

      if (!data.runId) return;

      if (data.type === "subscribe") {
        let bucket = this.subscriptions.get(data.runId);
        if (!bucket) {
          bucket = new Set<WebSocket>();
          this.subscriptions.set(data.runId, bucket);
        }
        bucket.add(socket);
        subscribedRuns.add(data.runId);

        socket.send(
          JSON.stringify({
            type: "subscribed",
            runId: data.runId,
          }),
        );
      }

      if (data.type === "unsubscribe") {
        this.subscriptions.get(data.runId)?.delete(socket);
        subscribedRuns.delete(data.runId);
        this.pruneRunBucket(data.runId);
      }
    });

    socket.on("close", () => {
      for (const runId of subscribedRuns) {
        this.subscriptions.get(runId)?.delete(socket);
        this.pruneRunBucket(runId);
      }
    });
  }
}
