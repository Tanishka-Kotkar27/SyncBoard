import { useState, useRef, useEffect, type FormEvent } from "react";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import type { ChatMessage, User } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  user: User;
  onSend: (text: string) => void;
  onClose: () => void;
}

export default function ChatPanel({ messages, user, onSend, onClose }: ChatPanelProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <h3>Chat</h3>
        <button className="chat-close" onClick={onClose} aria-label="Close chat">
          <FaTimes />
        </button>
      </div>

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hello!</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`chat-bubble ${m.userId === user.id ? "chat-own" : "chat-other"}`}
          >
            {m.userId !== user.id && (
              <span className="chat-sender">{m.userName}</span>
            )}
            <p className="chat-text">{m.text}</p>
            <span className="chat-time">
              {new Date(m.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          maxLength={500}
          aria-label="Message input"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Send">
          <FaPaperPlane />
        </button>
      </form>
    </aside>
  );
}
