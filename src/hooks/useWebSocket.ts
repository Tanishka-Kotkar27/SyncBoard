import { useEffect, useRef, useCallback, useState } from "react";
import type { WSEvent, RemoteCursor, ChatMessage } from "../types";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:4000";

interface UseWebSocketOptions {
  sessionId: string;
  userId: string;
  userName: string;
  onDraw?: (payload: unknown) => void;
  onClear?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCursorsChange?: (cursors: Map<string, RemoteCursor>) => void;
  onChatMessage?: (msg: ChatMessage) => void;
}

export function useWebSocket({
  sessionId,
  userId,
  userName,
  onDraw,
  onClear,
  onUndo,
  onRedo,
  onCursorsChange,
  onChatMessage,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const cursorsRef = useRef<Map<string, RemoteCursor>>(new Map());
  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState(0);

  const send = useCallback((event: WSEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("kc_access_token") || ""}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      send({ type: "join", sessionId, userId, userName });
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onmessage = (e) => {
      try {
        const event: WSEvent & { payload?: unknown; participants?: number } = JSON.parse(e.data);

        if (event.participants !== undefined) {
          setParticipants(event.participants);
        }

        if (event.userId === userId) return; // Ignore own events

        switch (event.type) {
          case "draw":
            onDraw?.(event.payload);
            break;
          case "clear":
            onClear?.();
            break;
          case "undo":
            onUndo?.();
            break;
          case "redo":
            onRedo?.();
            break;
          case "cursor": {
            const c = event.payload as RemoteCursor;
            cursorsRef.current.set(event.userId, {
              ...c,
              userId: event.userId,
              name: event.userName || event.userId,
            });
            onCursorsChange?.(new Map(cursorsRef.current));
            break;
          }
          case "leave":
            cursorsRef.current.delete(event.userId);
            onCursorsChange?.(new Map(cursorsRef.current));
            break;
          case "chat":
            onChatMessage?.(event.payload as ChatMessage);
            break;
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      send({ type: "leave", sessionId, userId, userName });
      ws.close();
    };
  }, [sessionId]);

  const broadcastDraw = useCallback(
    (payload: unknown) => {
      send({ type: "draw", sessionId, userId, userName, payload });
    },
    [send, sessionId, userId, userName]
  );

  const broadcastCursor = useCallback(
    (x: number, y: number, color: string) => {
      send({ type: "cursor", sessionId, userId, userName, payload: { x, y, color, userId, name: userName } });
    },
    [send, sessionId, userId, userName]
  );

  const broadcastClear = useCallback(() => {
    send({ type: "clear", sessionId, userId, userName });
  }, [send, sessionId, userId, userName]);

  const broadcastUndo = useCallback(() => {
    send({ type: "undo", sessionId, userId, userName });
  }, [send, sessionId, userId, userName]);

  const broadcastRedo = useCallback(() => {
    send({ type: "redo", sessionId, userId, userName });
  }, [send, sessionId, userId, userName]);

  const broadcastChat = useCallback(
    (msg: ChatMessage) => {
      send({ type: "chat", sessionId, userId, userName, payload: msg });
    },
    [send, sessionId, userId, userName]
  );

  return {
    connected,
    participants,
    broadcastDraw,
    broadcastCursor,
    broadcastClear,
    broadcastUndo,
    broadcastRedo,
    broadcastChat,
  };
}
