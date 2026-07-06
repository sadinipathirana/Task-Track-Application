import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  pending: "Pending",
  "in-progress": "In progress",
  completed: "Completed",
};

export default function TaskItem({ task, onDelete }) {
  const { user } = useAuth();
  const dueDate = new Date(task.dueDate);
  const isOverdue = task.status !== "completed" && dueDate < new Date();

  return (
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="space-y-3">
        <Link
          to={`/tasks/${task._id}`}
          className="text-base font-semibold text-slate-800 hover:text-emerald-700"
        >
          {task.title}
        </Link>
        <p className="text-sm leading-6 text-slate-500">
          {task.description || "No description provided."}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span
            className={`rounded-full px-2.5 py-1 font-semibold capitalize text-white ${task.status === "pending" ? "bg-amber-600" : task.status === "in-progress" ? "bg-sky-600" : "bg-emerald-700"}`}
          >
            {STATUS_LABELS[task.status]}
          </span>
          <span
            className={`${isOverdue ? "font-semibold text-red-600" : "text-slate-500"}`}
          >
            Due {dueDate.toLocaleDateString()}
          </span>
          {user?.role === "admin" && (
            <span className="text-slate-400">
              Owner: {task.owner?.name || "Unknown"}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          className="rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          to={`/tasks/${task._id}/edit`}
        >
          Edit
        </Link>
        <button
          className="rounded-full border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
          onClick={() => onDelete(task._id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
