import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page page--centered">
      <h1>404</h1>
      <p>This page doesn&apos;t exist.</p>
      <Link className="btn btn--primary" to="/">
        Back to tasks
      </Link>
    </div>
  );
}
