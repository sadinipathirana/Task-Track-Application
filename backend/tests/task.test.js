const request = require('supertest');
const app = require('./testApp');

async function registerUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `user${Date.now()}${Math.random()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { token: res.body.data.token, user: res.body.data.user };
}

function authed(req, token) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('Task API', () => {
  let userToken;
  let user;
  let adminToken;

  beforeEach(async () => {
    const u = await registerUser();
    userToken = u.token;
    user = u.user;

    const a = await registerUser({ role: 'admin' });
    adminToken = a.token;
  });

  describe('POST /api/tasks', () => {
    it('creates a task for the authenticated user', async () => {
      const res = await authed(request(app).post('/api/tasks'), userToken).send({
        title: 'Write README',
        description: 'Document setup steps',
        dueDate: '2026-08-01T00:00:00.000Z',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.task.title).toBe('Write README');
      expect(res.body.data.task.owner._id).toBe(user._id);
      expect(res.body.data.task.status).toBe('pending');
    });

    it('rejects a task without a title or due date', async () => {
      const res = await authed(request(app).post('/api/tasks'), userToken).send({});
      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated requests', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'x', dueDate: '2026-01-01' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await authed(request(app).post('/api/tasks'), userToken).send({
        title: 'Task 1',
        status: 'pending',
        dueDate: '2026-08-01',
      });
      await authed(request(app).post('/api/tasks'), userToken).send({
        title: 'Task 2',
        status: 'completed',
        dueDate: '2026-08-02',
      });
    });

    it('returns only the user\'s own tasks with pagination metadata', async () => {
      const res = await authed(request(app).get('/api/tasks'), userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(2);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('filters by status', async () => {
      const res = await authed(request(app).get('/api/tasks?status=completed'), userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].status).toBe('completed');
    });

    it('paginates results', async () => {
      const res = await authed(request(app).get('/api/tasks?page=1&limit=1'), userToken);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.pagination.totalPages).toBe(2);
    });

    it('allows admins to see all users\' tasks', async () => {
      const res = await authed(request(app).get('/api/tasks'), adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET/PUT/DELETE /api/tasks/:id', () => {
    let taskId;
    let otherUserToken;

    beforeEach(async () => {
      const createRes = await authed(request(app).post('/api/tasks'), userToken).send({
        title: 'Shared task',
        dueDate: '2026-08-01',
      });
      taskId = createRes.body.data.task._id;

      const other = await registerUser();
      otherUserToken = other.token;
    });

    it('retrieves a task by id for its owner', async () => {
      const res = await authed(request(app).get(`/api/tasks/${taskId}`), userToken);
      expect(res.status).toBe(200);
      expect(res.body.data.task._id).toBe(taskId);
    });

    it('returns 404 for a non-existent task', async () => {
      const res = await authed(request(app).get('/api/tasks/64a000000000000000000000'), userToken);
      expect(res.status).toBe(404);
    });

    it('forbids another regular user from accessing the task', async () => {
      const res = await authed(request(app).get(`/api/tasks/${taskId}`), otherUserToken);
      expect(res.status).toBe(403);
    });

    it('allows an admin to access any task', async () => {
      const res = await authed(request(app).get(`/api/tasks/${taskId}`), adminToken);
      expect(res.status).toBe(200);
    });

    it('updates a task owned by the requester', async () => {
      const res = await authed(request(app).put(`/api/tasks/${taskId}`), userToken).send({
        status: 'completed',
      });
      expect(res.status).toBe(200);
      expect(res.body.data.task.status).toBe('completed');
    });

    it('forbids updating another user\'s task', async () => {
      const res = await authed(request(app).put(`/api/tasks/${taskId}`), otherUserToken).send({
        status: 'completed',
      });
      expect(res.status).toBe(403);
    });

    it('deletes a task owned by the requester', async () => {
      const res = await authed(request(app).delete(`/api/tasks/${taskId}`), userToken);
      expect(res.status).toBe(200);

      const getRes = await authed(request(app).get(`/api/tasks/${taskId}`), userToken);
      expect(getRes.status).toBe(404);
    });
  });
});
