export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

export interface Session {
  id: string;
  name: string;
  createdBy: string;
}

export interface RemoteCursor {
  userId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export type WSEventType =
  | "join"
  | "leave"
  | "draw"
  | "cursor"
  | "clear"
  | "chat"
  | "undo"
  | "redo";

export interface WSEvent {
  type: WSEventType;
  sessionId: string;
  userId: string;
  userName?: string;
  payload?: unknown;
}
