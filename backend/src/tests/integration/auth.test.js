const request = require('supertest');
const app = require('../../server');
const { User } = require('../../models');
const { ValidationError } = require('../../utils/errors');

describe('Auth Controller', () => {
  let testUser;

  beforeEach(async () => {
    await User.destroy({ where: {}, force: true });
    testUser = await createTestUser();
  });

  describe('POST /api/auth/register', () => {
    const registerEndpoint = '/api/auth/register';

    it('should register a new user successfully', async () => {
      const adminToken = await getAuthToken({
        ...testUser.toJSON(),
        role: 'admin'
      });

      const response = await request(app)
        .post(registerEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'NewUser@123',
          confirmPassword: 'NewUser@123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not allow registration with existing email', async () => {
      const adminToken = await getAuthToken({
        ...testUser.toJSON(),
        role: 'admin'
      });

      const response = await request(app)
        .post(registerEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: testUser.email,
          password: 'Test@123',
          confirmPassword: 'Test@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email já cadastrado');
    });

    it('should validate required fields', async () => {
      const adminToken = await getAuthToken({
        ...testUser.toJSON(),
        role: 'admin'
      });

      const response = await request(app)
        .post(registerEndpoint)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.details).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    const loginEndpoint = '/api/auth/login';

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: testUser.email,
          password: 'Test@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: testUser.email,
          password: 'WrongPassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Credenciais inválidas');
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post(loginEndpoint)
        .send({
          email: 'nonexistent@example.com',
          password: 'Test@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Credenciais inválidas');
    });
  });

  describe('GET /api/auth/me', () => {
    const profileEndpoint = '/api/auth/me';

    it('should get user profile with valid token', async () => {
      const token = await getAuthToken(testUser);

      const response = await request(app)
        .get(profileEndpoint)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get(profileEndpoint);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get(profileEndpoint)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/me', () => {
    const updateEndpoint = '/api/auth/me';

    it('should update user profile successfully', async () => {
      const token = await getAuthToken(testUser);
      const newName = 'Updated Name';

      const response = await request(app)
        .put(updateEndpoint)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: newName });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe(newName);
    });

    it('should update password successfully', async () => {
      const token = await getAuthToken(testUser);
      const newPassword = 'NewPassword@123';

      const response = await request(app)
        .put(updateEndpoint)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Test@123',
          newPassword,
          confirmNewPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should not update with invalid current password', async () => {
      const token = await getAuthToken(testUser);

      const response = await request(app)
        .put(updateEndpoint)
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword@123',
          confirmNewPassword: 'NewPassword@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Senha atual incorreta');
    });
  });

  describe('POST /api/auth/logout', () => {
    const logoutEndpoint = '/api/auth/logout';

    it('should logout successfully', async () => {
      const token = await getAuthToken(testUser);

      const response = await request(app)
        .post(logoutEndpoint)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout realizado com sucesso');
    });

    it('should not logout without token', async () => {
      const response = await request(app)
        .post(logoutEndpoint);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
