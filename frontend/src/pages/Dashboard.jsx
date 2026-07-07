import { useState } from "react";
import { Link } from "react-router-dom";
import { useTasks } from "../hooks/useTasks";
import { deleteTask } from "../api/taskApi";
import TaskItem from "../components/TaskItem";
import TaskFilters from "../components/TaskFilters";
import Pagination from "../components/Pagination";

const LIMIT = 6;

export default function Dashboard() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [owner, setOwner] = useState("");

  const { tasks, pagination, loading, error, reload } = useTasks({
    page,
    limit: LIMIT,
    status,
    owner,
  });

  const handleFilterChange = (patch) => {
    if (patch.status !== undefined) setStatus(patch.status);
    if (patch.owner !== undefined) setOwner(patch.owner);
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task? This cannot be undone.")) return;
    await deleteTask(id);
    reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-serif text-2xl font-semibold text-emerald-900">Your Tasks</h1>
        <Link
          className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
          to="/tasks/new"
        >
          + New task
        </Link>
      </div>

      <TaskFilters
        status={status}
        owner={owner}
        onChange={handleFilterChange}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && <p className="text-sm text-slate-500">Loading tasks…</p>}

      {!loading && tasks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/70 p-10 text-center text-slate-500">
          <p>No tasks yet. Create one to get started.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tasks.map((task) => (
          <TaskItem key={task._id} task={task} onDelete={handleDelete} />
        ))}
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onChange={setPage}
      />
    </div>
  );
}
