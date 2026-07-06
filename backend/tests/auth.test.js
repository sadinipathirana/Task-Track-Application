const request = require('supertest');
const app = require('./testApp');

describe('Auth API', () => {
  const userPayload = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('registers a new user and returns a token', async () => {
      const res = await request(app).post('/api/auth/register').send(userPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userPayload.email);
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.token).toEqual(expect.any(String));
    });

    it('rejects duplicate emails', async () => {
      await request(app).post('/api/auth/register').send(userPayload);
      const res = await request(app).post('/api/auth/register').send(userPayload);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: '', email: 'not-an-email', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.details.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userPayload);
    });

    it('logs in with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userPayload.email, password: userPayload.password });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
    });

    it('rejects incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: userPayload.email, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the authenticated user with a valid token', async () => {
      const registerRes = await request(app).post('/api/auth/register').send(userPayload);
      const { token } = registerRes.body.data;

      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(userPayload.email);
    });

    it('rejects requests without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
