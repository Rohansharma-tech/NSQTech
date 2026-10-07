import request from 'supertest';

// Mock mongoose before importing app
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(undefined),
    connection: { on: jest.fn(), close: jest.fn() },
  };
});

jest.mock('../src/config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue(undefined),
}));

// Mock services
jest.mock('../src/services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    verifyToken: jest.fn(),
    hashPassword: jest.fn(),
  },
}));

jest.mock('../src/repositories/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
    toPublic: jest.fn((u) => u),
  },
}));

import { app } from '../src/index';
import { authService } from '../src/services/auth.service';
import { userRepository } from '../src/repositories/user.repository';

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for invalid credentials', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('INVALID_CREDENTIALS'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'bad', password: 'bad', role: 'general' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 200 with token on valid login', async () => {
    const mockUser = { _id: '1', userId: 'admin01', role: 'admin', name: 'Alice' };
    (authService.login as jest.Mock).mockResolvedValue({
      token: 'mock-jwt',
      user: mockUser,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'admin01', password: 'Admin@123', role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe('mock-jwt');
  });

  it('returns 400 for missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'admin01' }); // missing password and role

    expect(res.status).toBe(400);
  });

  it('returns 403 for disabled account', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('ACCOUNT_DISABLED'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ userId: 'user03', password: 'User@123', role: 'general' });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for invalid token', async () => {
    (authService.verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
  });

  it('returns user profile for valid token', async () => {
    const mockPayload = { sub: '1', userId: 'admin01', role: 'admin' };
    const mockUser = { _id: '1', userId: 'admin01', role: 'admin', name: 'Alice' };
    (authService.verifyToken as jest.Mock).mockReturnValue(mockPayload);
    (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
    (userRepository.toPublic as jest.Mock).mockReturnValue(mockUser);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe('admin01');
  });
});
