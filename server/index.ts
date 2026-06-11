import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { parse } from "url";

interface Client {
  ws: WebSocket;
  sessionId: string;
  userId: string;
  userName: string;
}

const PORT = Number(process.env.PORT || 4000);
const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("SyncBoard WebSocket Server");
});

const wss = new WebSocketServer({ server: httpServer });

// sessionId -> Set of clients
const sessions = new Map<string, Set<Client>>();
const clients = new Map<WebSocket, Client>();

function getSessionClients(sessionId: string): Set<Client> {
  if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
  return sessions.get(sessionId)!;
}

function broadcastToSession(sessionId: string, data: object, exclude?: WebSocket) {
  const sc = getSessionClients(sessionId);
  const payload = JSON.stringify({ ...data, participants: sc.size });
  for (const client of sc) {
    if (client.ws !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on("connection", (ws, req) => {
  const { query } = parse(req.url || "", true);
  // Token validation would go here; skipping deep Keycloak introspection for demo
  const _token = query.token as string;

  ws.on("message", (raw) => {
    try {
      const event = JSON.parse(raw.toString()) as {
        type: string;
        sessionId: string;
        userId: string;
        userName?: string;
        payload?: unknown;
      };

      const { type, sessionId, userId, userName = "Unknown" } = event;

      if (!sessionId || !userId) return;

      if (type === "join") {
        const client: Client = { ws, sessionId, userId, userName };
        clients.set(ws, client);
        getSessionClients(sessionId).add(client);
        broadcastToSession(sessionId, { type: "join", sessionId, userId, userName }, ws);
        // Send current participant count to joiner
        ws.send(JSON.stringify({ type: "sync", participants: getSessionClients(sessionId).size }));
        console.log(`[join] ${userName} (${userId}) -> session ${sessionId} (${getSessionClients(sessionId).size} users)`);
        return;
      }

      // Broadcast to rest of session
      broadcastToSession(sessionId, event, ws);

      if (type === "leave") {
        const client = clients.get(ws);
        if (client) {
          getSessionClients(sessionId).delete(client);
          clients.delete(ws);
          if (getSessionClients(sessionId).size === 0) sessions.delete(sessionId);
        }
        console.log(`[leave] ${userName} -> session ${sessionId}`);
      }
    } catch (err) {
      console.error("Message parse error:", err);
    }
  });

  ws.on("close", () => {
    const client = clients.get(ws);
    if (!client) return;
    const sc = getSessionClients(client.sessionId);
    sc.delete(client);
    clients.delete(ws);
    if (sc.size === 0) sessions.delete(client.sessionId);
    broadcastToSession(client.sessionId, {
      type: "leave",
      sessionId: client.sessionId,
      userId: client.userId,
      userName: client.userName,
    });
    console.log(`[disconnect] ${client.userName} from ${client.sessionId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`SyncBoard WebSocket server running on ws://localhost:${PORT}`);
});
