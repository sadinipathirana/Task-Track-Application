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
    <div className="page">
      <Link to="/" className="back-link">
        ← Back to tasks
      </Link>
      <h1>New task</h1>
      <TaskForm onSubmit={handleSubmit} submitLabel="Create task" />
    </div>
  );
}
