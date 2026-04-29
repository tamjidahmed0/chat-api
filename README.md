# Anonymous Chat API

Real-time group chat service built with NestJS · PostgreSQL · Drizzle ORM · Redis · Socket.io

---

## 🚀 Api Link
**Base URL:** https://chat.api.tamjidahmed.com/api/v1
**WebSocket:** wss://chat.api.tamjidahmed.com/chat

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

---

## Quick Start (Docker) — Recommended

### 1. Clone
```bash
git clone <repo-url>
cd chat-api
```

### 2. Environment setup
```bash
cp .env.example .env
```

### 3. Run
```bash
docker compose up -d --build
```

This single command will:
- Start Postgres and Redis
- Run database migrations
- Start the app

### 4. Verify
```bash
docker compose logs -f app
```


---

## Local Development (Without Docker App)

Run infrastructure in Docker, app locally with hot reload.

### 1. Clone
```bash
git clone 
cd chat-api
```

### 2. Environment setup
```bash
cp .env.example .env
```

> Open `.env` and update the following with your local database and Redis addresses:
> ```
> DATABASE_URL=postgresql://postgres:password@localhost:5432/chatdb
> REDIS_URL=redis://localhost:6379
> ```

### 3. Install dependencies
```bash
npm install
```

### 4. Run database migrations
```bash
npx drizzle-kit push --config=drizzle.config.ts
```

### 5. Start the app
```bash
npm run start:dev
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/chatdb` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `PORT` | App port | `3000` |
| `POSTGRES_USER` | Postgres username | `postgres` |
| `POSTGRES_PASSWORD` | Postgres password | `password` |
| `POSTGRES_DB` | Postgres database name | `chatdb` |


---

## API Reference

Base URL: `http://localhost:3000/api/v1`

Auth header: `Authorization: Bearer <sessionToken>` (not required for `/login`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Get or create a user and return a session token |
| GET | `/rooms` | List all rooms |
| POST | `/rooms` | Create a new room |
| GET | `/rooms/:id` | Get room details |
| DELETE | `/rooms/:id` | Delete a room (creator only) |
| GET | `/rooms/:id/messages` | Get paginated message history |
| POST | `/rooms/:id/messages` | Send a message |

---

## WebSocket

Connect to the `/chat` namespace:

```
ws://localhost:3000/chat?token=<sessionToken>&roomId=<roomId>
```

### Server → Client Events

| Event | Description |
|-------|-------------|
| `room:joined` | Emitted to the connecting client only on successful connection |
| `room:user_joined` | Broadcast to all other clients when a new user connects |
| `room:user_left` | Broadcast when a user disconnects or emits `room:leave` |
| `message:new` | Broadcast to all clients when a message is posted via REST |
| `room:deleted` | Broadcast to all clients when the room is deleted |

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `room:leave` | none | Graceful disconnect — removes user from active set and notifies others |
