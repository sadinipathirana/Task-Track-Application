import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import TaskForm from '../components/TaskForm';
import { fetchTaskById, updateTask } from '../api/taskApi';

export default function TaskEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskById(id)
      .then((res) => setTask(res.data.task))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load this task.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values) => {
    await updateTask(id, values);
    navigate(`/tasks/${id}`);
  };

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-10 text-slate-500">Loading…</div>;
  if (error)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to={`/tasks/${id}`} className="mb-4 inline-block text-sm text-emerald-800 hover:underline">
        ← Back to task
      </Link>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-emerald-900">Edit task</h1>
      <TaskForm initialValues={task} onSubmit={handleSubmit} submitLabel="Save changes" />
    </div>
  );
}
