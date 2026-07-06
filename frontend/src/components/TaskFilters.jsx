import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUsers } from "../api/userApi";

const STATUS_OPTIONS = ["", "pending", "in-progress", "completed"];

export default function TaskFilters({ status, owner, onChange }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role !== "admin") return;

    fetchUsers()
      .then((res) => setUsers(res.data.users))
      .catch(() => setError("Unable to load users for filtering."));
  }, [user]);

  return (
    <div className="flex flex-wrap gap-4 rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
      <label className="flex flex-col gap-2 text-sm text-slate-600">
        <span>Status</span>
        <select
          className="min-w-[160px] rounded-lg border border-slate-200 px-3 py-2"
          value={status}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "" ? "All" : opt}
            </option>
          ))}
        </select>
      </label>

      {user?.role === "admin" && (
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          <span>Owner</span>
          <select
            className="min-w-[220px] rounded-lg border border-slate-200 px-3 py-2"
            value={owner}
            onChange={(e) => onChange({ owner: e.target.value })}
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {error && <small className="text-xs text-slate-500">{error}</small>}
        </label>
      )}
    </div>
  );
}
