import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-emerald-100 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div
          className="cursor-pointer text-2xl font-bold text-emerald-900"
          onClick={() => navigate("/")}
        >
          Task Tracker
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
              <span
                className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-600" : "bg-slate-400"}`}
              />
              {connected ? "Live" : "Offline"}
            </span>
            <span className="hidden sm:inline">
              {user?.name}{" "}
              <span className="capitalize text-slate-500">({user?.role})</span>
            </span>
            <button
              className="rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-emerald-300 hover:text-emerald-800"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
