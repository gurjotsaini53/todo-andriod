const request = require('supertest');
const app = require('../server');

describe('Todo API Tests', () => {
  let authToken;
  let userId;
  let todoId;

  // Test user data
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPass123'
  };

  const testTodo = {
    title: 'Test Todo',
    description: 'This is a test todo',
    priority: 'high',
    tags: ['test', 'api']
  };

  describe('Authentication', () => {
    test('POST /api/auth/register - Should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();
      
      authToken = response.body.data.token;
      userId = response.body.data.user.id;
    });

    test('POST /api/auth/login - Should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.token).toBeDefined();
    });

    test('GET /api/auth/me - Should get current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.email).toBe(testUser.email);
    });
  });

  describe('Todos', () => {
    test('POST /api/todos - Should create a new todo', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testTodo)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.todo.title).toBe(testTodo.title);
      expect(response.body.data.todo.completed).toBe(false);
      
      todoId = response.body.data.todo.id;
    });

    test('GET /api/todos - Should get all todos', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.todos).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('GET /api/todos/:id - Should get single todo', async () => {
      const response = await request(app)
        .get(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.todo.id).toBe(todoId);
    });

    test('PUT /api/todos/:id - Should update todo', async () => {
      const updateData = {
        title: 'Updated Todo Title',
        completed: true
      };

      const response = await request(app)
        .put(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.todo.title).toBe(updateData.title);
      expect(response.body.data.todo.completed).toBe(true);
    });

    test('PATCH /api/todos/:id/toggle - Should toggle todo completion', async () => {
      const response = await request(app)
        .patch(`/api/todos/${todoId}/toggle`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.todo.completed).toBe(false);
    });

    test('GET /api/todos/stats - Should get todo statistics', async () => {
      const response = await request(app)
        .get('/api/todos/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.total).toBeGreaterThan(0);
    });

    test('DELETE /api/todos/:id - Should delete todo', async () => {
      const response = await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
    });
  });

  describe('Error Handling', () => {
    test('POST /api/auth/register - Should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'invalid-email',
          password: 'TestPass123'
        })
        .expect(400);

      expect(response.body.status).toBe('error');
    });

    test('GET /api/todos - Should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(401);

      expect(response.body.status).toBe('error');
    });

    test('GET /api/todos/invalid-id - Should return 404 for non-existent todo', async () => {
      const response = await request(app)
        .get('/api/todos/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Health Check', () => {
    test('GET /api/health - Should return server status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('Server is running');
    });
  });
});
