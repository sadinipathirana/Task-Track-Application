import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
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
        <h1 className="mb-6 text-2xl font-semibold text-emerald-800">Log in</h1>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

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

        <label className="mb-5 flex flex-col gap-2 text-sm text-slate-600">
          <span>Password</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 outline-none ring-0 focus:border-emerald-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          className="w-full rounded-full bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
          disabled={submitting}
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-emerald-700" to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
