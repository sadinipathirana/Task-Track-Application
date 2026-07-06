import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-12 sm:px-6 lg:px-8">
      <form
        className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-100/70"
        onSubmit={handleSubmit}
      >
        <h1 className="mb-6 text-2xl font-semibold text-emerald-800">
          Create an account
        </h1>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="mb-4 flex flex-col gap-2 text-sm text-slate-600">
          <span>Name</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-0 focus:border-emerald-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="mb-4 flex flex-col gap-2 text-sm text-slate-600">
          <span>Email</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-0 focus:border-emerald-500"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="mb-4 flex flex-col gap-2 text-sm text-slate-600">
          <span>Password</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-0 focus:border-emerald-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        <label className="mb-5 flex flex-col gap-2 text-sm text-slate-600">
          <span>Role</span>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <small className="text-xs text-slate-500">
            Role selection is open for this assignment&apos;s evaluation
            purposes; see README for notes.
          </small>
        </label>

        <button
          className="w-full rounded-full bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link className="font-medium text-emerald-700" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
