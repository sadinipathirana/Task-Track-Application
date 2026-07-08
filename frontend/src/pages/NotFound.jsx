import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-serif text-4xl font-semibold text-emerald-900">
        404
      </h1>
      <p className="text-slate-600">This page doesn&apos;t exist.</p>
      <Link
        className="rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
        to="/"
      >
        Back to tasks
      </Link>
    </div>
  );
}
