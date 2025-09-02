# Express TypeScript Blog API

A RESTful API for a blog application with authentication, session management, and CRUD operations for blogs.

## Features

- User authentication with JWT tokens
- Session management with refresh tokens
- Blog post CRUD operations
- Input validation using Zod
- Error handling and security best practices
- TypeScript for type safety

## Dev Tools

- Logging: morgan
- CORS: cors
- Environment: dotenv
- Validation: zod
- Authentication: jsonwebtoken, bcrypt

## API Endpoints

### Authentication

- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login and get tokens
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout and invalidate session

### Session Management

- `GET /api/sessions` — Get all active sessions for current user
- `DELETE /api/sessions/:sessionId` — Terminate a specific session
- `DELETE /api/sessions` — Terminate all sessions except current

### Users

- `GET /api/users` — Get all users
- `GET /api/users/:id` — Get a specific user
- `PUT /api/users/:id` — Update user details
- `DELETE /api/users/:id` — Delete a user

### Blog Posts

- `GET /api/blogs` — Get all blog posts
- `GET /api/blogs/:id` — Get a specific blog post
- `POST /api/blogs` — Create a new blog post
- `PUT /api/blogs/:id` — Update a blog post
- `DELETE /api/blogs/:id` — Delete a blog post

## Project Structure

```bash
src/
├── config/              # Env vars, DB connection config
├── controllers/         # Express route controllers (business logic)
├── middlewares/         # Auth, error handling, validation
├── routes/              # Express route definitions
├── utils/               # Reusable helpers, auth utilities
├── validation/          # Input validation schemas
├── types/               # TypeScript type definitions
├── prisma.ts            # Prisma client initialization
├── server.ts            # Entry point (Express app)
├── app.ts               # Express app setup
```

## Getting Started

1. Clone the repository
2. Install dependencies:

  ```bash
  npm install
  ```

3. Create a `.env` file:

  ```
  DATABASE_URL="file:./dev.db"
  PORT=4000
  JWT_SECRET="your_jwt_secret_here"
  JWT_SECRET_EXPIRES_IN="15m"
  JWT_REFRESH_SECRET="your_refresh_token_secret_here"
  JWT_REFRESH_SECRET_EXPIRES_IN="30d"
  ```

4. Run Prisma migration:

  ```bash
  npx prisma migrate dev
  ```

5. Start the development server:

  ```bash
  npm run dev
  ```

## Security Features

- HTTP-only cookies for storing tokens
- Refresh token rotation
- Password hashing with bcrypt
- Validation of all input data
- Permission-based access control
- Session tracking and management

## Workflow

- User logs in with credentials to the server; the server sends a JSON payload (access token, refresh token).
- Step 2: Accessing a protected resource (using the access token).
- Step 3: The access token expires (getting a new one).
- The app stores the access token in memory and the refresh token in a more secure, persistent storage.
