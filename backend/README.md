# To-Do App Backend

NestJS backend service providing REST APIs for authentication and task management, backed by MongoDB.

## Project Setup

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Development mode
npm run start

# Watch mode
npm run start:dev

# Production build & run
npm run build
npm run start:prod
```

## Testing

```bash
# Run unit tests
npm run test
```

## Environment Variables

Configure the following variables in `.env`:
- `MONGODB_URI`: MongoDB connection string (e.g. `mongodb://localhost:27017/todo-app`)
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Application HTTP port (default: `3000`)
