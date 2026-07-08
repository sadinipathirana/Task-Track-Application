import { useNavigate, Link } from "react-router-dom";
import TaskForm from "../components/TaskForm";
import { createTask } from "../api/taskApi";

export default function TaskCreate() {
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    await createTask(values);
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        to="/"
        className="mb-4 inline-block text-sm text-emerald-800 hover:underline"
      >
        ← Back to tasks
      </Link>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-emerald-900">
        New task
      </h1>
      <TaskForm onSubmit={handleSubmit} submitLabel="Create task" />
    </div>
  );
}
