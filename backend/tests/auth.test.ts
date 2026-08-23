import request from 'supertest';
import { app } from '../src/index';

describe('Auth & RBAC Suite', () => {
  const testEmail = `user.${Date.now()}@test.com`;
  let patientToken: string;

  test('POST /api/auth/register creates a patient account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'Password123!',
        firstName: 'Alex',
        lastName: 'Morgan',
        role: 'patient'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    patientToken = res.body.data.accessToken;
  });

  test('POST /api/auth/login validates credentials and returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  test('RBAC Middleware: Patient receives 403 Forbidden when accessing Admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard-stats')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
