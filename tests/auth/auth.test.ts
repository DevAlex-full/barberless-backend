import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../../src/app';
import { createPrismaAdapter } from '../../src/shared/prisma/createPrismaAdapter';

describe('Auth Module', () => {
  let app: any;
  let prisma: any;

  beforeEach(async () => {
    app = await buildApp();
    // Use the adapter helper to get the client
    const { client } = createPrismaAdapter();
    prisma = client;
  });

  it('should register a new user', async () => {
    if (!prisma) return; // Skip if DB not configured in env

    const payload = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: payload,
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.payload).email).toBe(payload.email);
  });

  it('should login successfully with correct credentials', async () => {
    if (!prisma) return;

    const email = 'login@example.com';
    const password = 'password123';

    await prisma.user.deleteMany({ where: { email } });
    await prisma.user.create({
      data: {
        email,
        passwordHash: await import('bcrypt').then(b => b.hashSync(password, 12)),
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toHaveProperty('token');
  });

  it('should fail login with wrong password', async () => {
    if (!prisma) return;

    const email = 'wrong@example.com';
    const password = 'password123';

    await prisma.user.deleteMany({ where: { email } });
    await prisma.user.create({
      data: {
        email,
        passwordHash: await import('bcrypt').then(b => b.hashSync(password, 12)),
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password: 'wrongpassword' },
    });

    expect(response.statusCode).toBe(401);
  });
});
