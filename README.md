# Todo Backend API

A production-grade Node.js backend API for Android todo applications with MongoDB, JWT authentication, and comprehensive CRUD operations.

## Features

- 🔐 **JWT Authentication** - Secure email/password authentication
- 📝 **Todo Management** - Full CRUD operations with checkboxes and timestamps
- 🏷️ **Priority & Tags** - Organize todos with priority levels and custom tags
- 📊 **Statistics** - Get user todo statistics and analytics
- 🔒 **Security** - Rate limiting, CORS, helmet, input validation
- 📱 **Mobile Ready** - Optimized for Android applications
- 🚀 **Production Ready** - Error handling, logging, graceful shutdown

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **morgan** - HTTP request logging

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp config.env.example config.env
   # Edit config.env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   # For local development: mongod
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Configuration

Create a `config.env` file in the root directory:

```env
NODE_ENV=development
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/todo-app

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/profile` | Update user profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |

### Todos

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/todos` | Get all todos | Private |
| GET | `/api/todos/stats` | Get todo statistics | Private |
| GET | `/api/todos/:id` | Get single todo | Private |
| POST | `/api/todos` | Create new todo | Private |
| PUT | `/api/todos/:id` | Update todo | Private |
| PATCH | `/api/todos/:id/toggle` | Toggle completion | Private |
| DELETE | `/api/todos/:id` | Delete single todo | Private |
| DELETE | `/api/todos` | Delete completed todos | Private |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/health` | Server health status | Public |

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Todos

#### Create Todo
```http
POST /api/todos
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the todo backend API",
  "priority": "high",
  "dueDate": "2024-01-15T10:00:00.000Z",
  "tags": ["work", "urgent"]
}
```

#### Get All Todos
```http
GET /api/todos?page=1&limit=10&completed=false&priority=high&sortBy=createdAt&sortOrder=desc
Authorization: Bearer <jwt-token>
```

#### Update Todo
```http
PUT /api/todos/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true,
  "priority": "medium"
}
```

#### Toggle Todo Completion
```http
PATCH /api/todos/:id/toggle
Authorization: Bearer <jwt-token>
```

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required, 2-50 chars),
  email: String (required, unique, valid email),
  password: String (required, min 6 chars, hashed),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Todo Model
```javascript
{
  _id: ObjectId,
  title: String (required, 1-200 chars),
  description: String (optional, max 1000 chars),
  completed: Boolean (default: false),
  priority: String (enum: ['low', 'medium', 'high'], default: 'medium'),
  dueDate: Date (optional),
  tags: [String] (optional, max 20 chars each),
  user: ObjectId (ref: 'User', required),
  completedAt: Date (auto-set when completed),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- **Password Hashing** - bcrypt with salt rounds
- **JWT Tokens** - Secure authentication
- **Rate Limiting** - Prevent abuse
- **CORS** - Cross-origin protection
- **Helmet** - Security headers
- **Input Validation** - Prevent injection attacks
- **Error Handling** - No sensitive data exposure

## Error Handling

The API returns consistent error responses:

```javascript
{
  "status": "error",
  "message": "Error description",
  "errors": [ // Only for validation errors
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email"
    }
  ]
}
```

## Response Format

All successful responses follow this format:

```javascript
{
  "status": "success",
  "message": "Operation description", // Optional
  "data": {
    // Response data
  }
}
```

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Project Structure
```
todo-backend/
├── models/
│   ├── User.js
│   └── Todo.js
├── routes/
│   ├── auth.js
│   └── todos.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── server.js
├── package.json
└── config.env
```

## Production Deployment

1. **Set production environment variables**
2. **Use a production MongoDB instance**
3. **Set up process manager (PM2)**
4. **Configure reverse proxy (Nginx)**
5. **Enable HTTPS**
6. **Set up monitoring and logging**

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'todo-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## Testing

Test the API endpoints using tools like Postman or curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123"}'
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository.
# todo-andriod
