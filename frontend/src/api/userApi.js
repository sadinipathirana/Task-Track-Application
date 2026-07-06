import api from './axios';

export const fetchUsers = () => api.get('/users').then((r) => r.data);
