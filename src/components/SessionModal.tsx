import { useState, type FormEvent } from "react";
import { FaTimes, FaPlus, FaLink } from "react-icons/fa";
import { nanoid } from "nanoid";

interface SessionModalProps {
  mode: "create" | "join";
  onConfirm: (sessionId: string, sessionName: string) => void;
  onClose: () => void;
}

export default function SessionModal({ mode, onConfirm, onClose }: SessionModalProps) {
  const [sessionId, setSessionId] = useState("");
  const [sessionName, setSessionName] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      const id = nanoid(8);
      onConfirm(id, sessionName || `Board-${id}`);
    } else {
      onConfirm(sessionId.trim(), sessionId.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "create" ? "Create new board" : "Join board"}
      >
        <div className="modal-header">
          <h2>{mode === "create" ? "Create New Board" : "Join Board"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" noValidate>
          {mode === "create" ? (
            <div className="modal-field">
              <label htmlFor="board-name">Board Name</label>
              <input
                id="board-name"
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Sprint Planning"
                autoFocus
              />
              <p className="modal-hint">A unique session ID will be auto-generated.</p>
            </div>
          ) : (
            <div className="modal-field">
              <label htmlFor="session-id">Session ID</label>
              <input
                id="session-id"
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Paste session ID here"
                required
                autoFocus
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={mode === "join" && !sessionId.trim()}
            >
              {mode === "create" ? (
                <>
                  <FaPlus /> Create
                </>
              ) : (
                <>
                  <FaLink /> Join
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
