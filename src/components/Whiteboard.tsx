import { useRef, useState, useCallback } from "react";
import DrawingCanvas, { type DrawingCanvasHandle } from "./DrawingCanvas";
import ChatPanel from "./ChatPanel";
import SessionModal from "./SessionModal";
import { useWebSocket } from "../hooks/useWebSocket";
import type { User, RemoteCursor, ChatMessage } from "../types";
import { nanoid } from "nanoid";
import {
  FaUndo, FaRedo, FaSave, FaPalette, FaPaintBrush,
  FaPlus, FaUsers, FaEraser, FaCommentAlt, FaCopy,
  FaTrash, FaFilePdf,
} from "react-icons/fa";

interface WhiteboardProps {
  user: User;
}

type Tool = "pen" | "eraser";

export default function Whiteboard({ user }: WhiteboardProps) {
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState<Tool>("pen");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cursors, setCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [sessionId, setSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [modal, setModal] = useState<null | "create" | "join">(null);
  const [copied, setCopied] = useState(false);

  const onRemoteDraw = useCallback((data: unknown) => {
    canvasRef.current?.applyRemoteDraw(data);
  }, []);

  const onRemoteClear = useCallback(() => {
    canvasRef.current?.applyRemoteClear();
  }, []);

  const onRemoteUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const onRemoteRedo = useCallback(() => {
    canvasRef.current?.redo();
  }, []);

  const onChatMsg = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const { connected, participants, broadcastDraw, broadcastCursor, broadcastClear, broadcastChat } =
    useWebSocket({
      sessionId,
      userId: user.id,
      userName: user.name,
      onDraw: onRemoteDraw,
      onClear: onRemoteClear,
      onUndo: onRemoteUndo,
      onRedo: onRemoteRedo,
      onCursorsChange: setCursors,
      onChatMessage: onChatMsg,
    });

  function handleSessionConfirm(id: string, name: string) {
    setSessionId(id);
    setSessionName(name);
    setModal(null);
  }

  function copyId() {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function sendMessage(text: string) {
    const msg: ChatMessage = {
      id: nanoid(),
      userId: user.id,
      userName: user.name,
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    broadcastChat(msg);
  }

  function save(format: "png" | "pdf") {
    canvasRef.current?.saveBoard(format);
  }

  function clearBoard() {
    canvasRef.current?.clearBoard();
    broadcastClear();
  }

  function undo() { canvasRef.current?.undo(); }
  function redo() { canvasRef.current?.redo(); }

  return (
    <div className="board-container">
      <nav className="top-nav">
        <div className="nav-left">
          <span className="logo">SyncBoard</span>
          {sessionId && (
            <div className="session-badge">
              <span className={`dot ${connected ? "dot-green" : "dot-red"}`} />
              <span className="session-name">{sessionName}</span>
              <button className="copy-btn" onClick={copyId} title="Copy session ID">
                {copied ? "✓" : <FaCopy />}
              </button>
              {participants > 0 && (
                <span className="participants-badge">
                  <FaUsers size={11} /> {participants}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="nav-right">
           <div className="user-badge" title={user.name}>
             {user.name.charAt(0).toUpperCase()}
           </div>
        </div>
      </nav>

      <main className="workspace">
        <div className="toolbar" role="toolbar" aria-label="Drawing tools">
          <button className="tool-btn" title="Undo" onClick={undo}>
            <FaUndo />
          </button>
          <button className="tool-btn" title="Redo" onClick={redo}>
            <FaRedo />
          </button>

          <div className="divider" />
          <button
            className={`tool-btn${tool === "pen" ? " tool-active" : ""}`}
            title="Pen"
            onClick={() => setTool("pen")}
          >
            <FaPaintBrush />
          </button>
          <button
            className={`tool-btn${tool === "eraser" ? " tool-active" : ""}`}
            title="Eraser"
            onClick={() => setTool("eraser")}
          >
            <FaEraser />
          </button>

          <div className="divider" />
          <label className="tool-btn color-btn" title="Pick color">
            <FaPalette style={{ color }} />
            <input
              type="color"
              value={color}
              onChange={e => { setColor(e.target.value); setTool("pen"); }}
            />
          </label>

          <select
            className="size-select"
            value={brushSize}
            onChange={e => setBrushSize(Number(e.target.value))}
            aria-label="Brush size"
          >
            {[2, 4, 6, 8, 12, 16, 24].map(s => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>

          <div className="divider" />
          <button className="tool-btn" title="Save as PNG" onClick={() => save("png")}>
            <FaSave />
          </button>
          <button className="tool-btn" title="Save as PDF" onClick={() => save("pdf")}>
            <FaFilePdf />
          </button>

          <button className="tool-btn" title="Clear board" onClick={clearBoard}>
            <FaTrash />
          </button>

          <div className="divider" />
          <button
            className="tool-btn"
            title="Chat"
            onClick={() => setChatOpen(!chatOpen)}
            aria-pressed={chatOpen}
          >
            <FaCommentAlt />
            {messages.length > 0 && !chatOpen && <span className="chat-dot" />}
          </button>
          <div className="divider" />
          <button className="tool-btn" title="New board" onClick={() => setModal("create")}>
            <FaPlus />
          </button>
          <button className="tool-btn" title="Join session" onClick={() => setModal("join")}>
            <FaUsers />
          </button>
        </div>

        <div className="board-area">
          {!sessionId && (
            <div className="empty-state">
              <h2>Welcome, {user.name}!</h2>
              <p>Start a new board or join an existing session.</p>
              <div className="empty-actions">
                <button className="btn-primary" onClick={() => setModal("create")}>
                  <FaPlus /> New Board
                </button>
                <button className="btn-secondary" onClick={() => setModal("join")}>
                  <FaUsers /> Join Board
                </button>
              </div>
            </div>
          )}

          <div className="whiteboard-card" style={{ display: sessionId ? undefined : "none" }}>
            <DrawingCanvas
              ref={canvasRef}
              selectedColor={color}
              brushSize={brushSize}
              tool={tool}
              remoteCursors={cursors}
              onDraw={broadcastDraw}
              onCursorMove={(x, y) => broadcastCursor(x, y, color)}
              onBoardAction={type => { if (type === "clear") broadcastClear(); }}
            />
          </div>
        </div>
      </main>

      {chatOpen && (
        <ChatPanel
          messages={messages}
          user={user}
          onSend={sendMessage}
          onClose={() => setChatOpen(false)}
        />
      )}

      {modal && (
        <SessionModal
          mode={modal}
          onConfirm={handleSessionConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
