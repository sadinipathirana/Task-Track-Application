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

describe('User API', () => {
  describe('GET /api/users', () => {
    it('rejects unauthenticated requests', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('forbids regular users from listing users', async () => {
      const { token } = await registerUser();
      const res = await authed(request(app).get('/api/users'), token);
      expect(res.status).toBe(403);
    });

    it('allows admins to list all users without exposing passwords', async () => {
      await registerUser({ name: 'Alice' });
      await registerUser({ name: 'Bob' });
      const { token: adminToken } = await registerUser({ name: 'Admin', role: 'admin' });

      const res = await authed(request(app).get('/api/users'), adminToken);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data.users[0].password).toBeUndefined();
      // sorted by name
      const names = res.body.data.users.map((u) => u.name);
      expect(names).toEqual([...names].sort());
    });
  });
});
