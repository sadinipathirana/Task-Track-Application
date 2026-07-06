import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import TaskForm from "../components/TaskForm";
import { fetchTaskById, updateTask } from "../api/taskApi";

export default function TaskEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskById(id)
      .then((res) => setTask(res.data.task))
      .catch((err) =>
        setError(err.response?.data?.message || "Unable to load this task."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values) => {
    await updateTask(id, values);
    navigate(`/tasks/${id}`);
  };

  if (loading) return <div className="page">Loading…</div>;
  if (error)
    return (
      <div className="page">
        <div className="alert alert--error">{error}</div>
      </div>
    );

  return (
    <div className="page">
      <Link to={`/tasks/${id}`} className="back-link">
        ← Back to task
      </Link>
      <h1>Edit task</h1>
      <TaskForm
        initialValues={task}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      />
    </div>
  );
}
