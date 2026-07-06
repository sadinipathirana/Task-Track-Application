import api from './axios';

export const fetchTasks = (params) => api.get('/tasks', { params }).then((r) => r.data);
export const fetchTaskById = (id) => api.get(`/tasks/${id}`).then((r) => r.data);
export const createTask = (payload) => api.post('/tasks', payload).then((r) => r.data);
export const updateTask = (id, payload) => api.put(`/tasks/${id}`, payload).then((r) => r.data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`).then((r) => r.data);
