import { useState, type FormEvent } from "react";
import { FaDrawPolygon } from "react-icons/fa";

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string | null;
  loading: boolean;
}

export default function LoginPage({ onLogin, error, loading }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <FaDrawPolygon size={28} />
          </div>
          <h1 className="login-title">SyncBoard</h1>
          <p className="login-subtitle">Real-time collaborative whiteboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !username || !password}
          >
            {loading ? (
              <span className="spinner-small" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="login-footer">
          Accounts are managed via{" "}
          <a href="http://localhost:8080" target="_blank" rel="noreferrer">
            Keycloak
          </a>
        </p>
      </div>
    </div>
  );
}
