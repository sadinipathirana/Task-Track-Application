import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchTaskById, deleteTask } from "../api/taskApi";
import { useSocket } from "../context/SocketContext";

const STATUS_LABELS = {
  pending: "Pending",
  "in-progress": "In progress",
  completed: "Completed",
};

const STATUS_BADGE_CLASSES = {
  pending: "bg-amber-500",
  "in-progress": "bg-sky-600",
  completed: "bg-emerald-700",
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTaskById(id);
      setTask(res.data.task);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this task.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const handleUpdate = (updated) => {
      if (updated._id === id) setTask(updated);
    };
    const handleDelete = (payload) => {
      if (payload.id === id) navigate("/");
    };
    socket.on("task:updated", handleUpdate);
    socket.on("task:deleted", handleDelete);
    return () => {
      socket.off("task:updated", handleUpdate);
      socket.off("task:deleted", handleDelete);
    };
  }, [socket, id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    await deleteTask(id);
    navigate("/");
  };

  if (loading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-slate-500">
        Loading…
      </div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  if (!task) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-emerald-800 hover:underline"
      >
        ← Back to tasks
      </Link>

      <div className="rounded-2xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="font-serif text-2xl font-semibold text-emerald-900">
            {task.title}
          </h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize text-white ${STATUS_BADGE_CLASSES[task.status]}`}
          >
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <p className="mb-6 text-slate-600">
          {task.description || "No description provided."}
        </p>

        <dl className="mb-6 grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt className="text-slate-500">Due date</dt>
          <dd className="text-slate-900">
            {new Date(task.dueDate).toLocaleDateString()}
          </dd>
          <dt className="text-slate-500">Owner</dt>
          <dd className="text-slate-900">
            {task.owner?.name} ({task.owner?.email})
          </dd>
          <dt className="text-slate-500">Created</dt>
          <dd className="text-slate-900">
            {new Date(task.createdAt).toLocaleString()}
          </dd>
          <dt className="text-slate-500">Last updated</dt>
          <dd className="text-slate-900">
            {new Date(task.updatedAt).toLocaleString()}
          </dd>
        </dl>

        <div className="flex gap-3">
          <Link
            className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            to={`/tasks/${task._id}/edit`}
          >
            Edit task
          </Link>
          <button
            className="rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            onClick={handleDelete}
          >
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}
