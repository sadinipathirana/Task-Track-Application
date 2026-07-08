import { useState } from "react";
function toDateInputValue(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toISOString().slice(0, 10);
}
export default function TaskForm({
  initialValues,
  onSubmit,
  submitLabel = "Save task",
}) {
  const [title, setTitle] = useState(initialValues?.title || "");
  const [description, setDescription] = useState(
    initialValues?.description || "",
  );
  const [status, setStatus] = useState(initialValues?.status || "pending");
  const [dueDate, setDueDate] = useState(
    toDateInputValue(initialValues?.dueDate),
  );
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!dueDate) {
      setError("Due date is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        status,
        dueDate: new Date(dueDate).toISOString(),
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <form
      className="flex max-w-xl flex-col gap-5 rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm"
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <label className="flex flex-col gap-2 text-sm text-slate-600">
        <span>Title</span>
        <input
          className="rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Write project README"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-slate-600">
        <span>Description</span>
        <textarea
          className="resize-none rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Add any relevant detail"
        />
      </label>

      <div className="flex flex-col gap-5 sm:flex-row">
        <label className="flex flex-1 flex-col gap-2 text-sm text-slate-600">
          <span>Status</span>
          <select
            className="rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-2 text-sm text-slate-600">
          <span>Due date</span>
          <input
            type="date"
            className="rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
      </div>

      <button
        className="rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
