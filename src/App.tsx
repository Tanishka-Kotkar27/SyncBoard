import "./App.css";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./components/LoginPage";
import Whiteboard from "./components/Whiteboard";

function App() {
  const { user, loading, error, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="splash">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} error={error} loading={loading} />;
  }

  return <Whiteboard user={user} onLogout={logout} />;
}

export default App;
