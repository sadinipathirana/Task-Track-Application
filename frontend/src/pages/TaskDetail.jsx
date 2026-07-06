import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchTaskById, deleteTask } from "../api/taskApi";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const STATUS_LABELS = {
  pending: "Pending",
  "in-progress": "In progress",
  completed: "Completed",
};

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  if (loading) return <div className="page">Loading…</div>;
  if (error)
    return (
      <div className="page">
        <div className="alert alert--error">{error}</div>
      </div>
    );
  if (!task) return null;

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Back to tasks
      </Link>

      <div className="detail-card">
        <div className="detail-card__header">
          <h1>{task.title}</h1>
          <span className={`badge badge--${task.status}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <p className="detail-card__description">
          {task.description || "No description provided."}
        </p>

        <dl className="detail-card__meta">
          <dt>Due date</dt>
          <dd>{new Date(task.dueDate).toLocaleDateString()}</dd>
          {user?.role === "admin" && (
            <>
              <dt>Owner</dt>
              <dd>
                {task.owner?.name} ({task.owner?.email})
              </dd>
            </>
          )}
          <dt>Created</dt>
          <dd>{new Date(task.createdAt).toLocaleString()}</dd>
          <dt>Last updated</dt>
          <dd>{new Date(task.updatedAt).toLocaleString()}</dd>
        </dl>

        <div className="detail-card__actions">
          <Link className="btn btn--primary" to={`/tasks/${task._id}/edit`}>
            Edit task
          </Link>
          <button className="btn btn--danger" onClick={handleDelete}>
            Delete task
          </button>
        </div>
      </div>
    </div>
  );
}
