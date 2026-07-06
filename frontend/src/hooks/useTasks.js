import { useCallback, useEffect, useState } from 'react';
import { fetchTasks } from '../api/taskApi';
import { useSocket } from '../context/SocketContext';

// Fetches a page of tasks for the given filters and keeps them in sync via
// Socket.IO events emitted by the backend (task:created/updated/deleted).
export function useTasks({ page, limit, status, owner }) {
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchTasks({ page, limit, status: status || undefined, owner: owner || undefined });
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, owner]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;

    // Simplest correct strategy for real-time updates: any relevant change
    // triggers a re-fetch of the current page, so pagination/filters/sorting
    // stay correct without complex client-side merge logic.
    const handleChange = () => load();

    socket.on('task:created', handleChange);
    socket.on('task:updated', handleChange);
    socket.on('task:deleted', handleChange);

    return () => {
      socket.off('task:created', handleChange);
      socket.off('task:updated', handleChange);
      socket.off('task:deleted', handleChange);
    };
  }, [socket, load]);

  return { tasks, pagination, loading, error, reload: load };
}
