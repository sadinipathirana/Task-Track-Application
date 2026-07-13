# Task Tracker

A full-stack task tracking application with authentication, role-based
access control, real-time updates.

Tech Stack:

React + Vite . 
Node.js + Express . 
MongoDB . 
JWT .
Socket.IO .
Jest + Supertest .
GitHub Actions

```
task-tracker/
├── backend/           Express API, MongoDB models, Socket.IO, tests
├── frontend/           React + Vite single-page app
├── postman/            Postman collection + environment
└── .github/workflows/   CI and CD pipelines
```

## Table of contents

- [Setup instructions](#setup-instructions)
- [Running tests](#running-tests)
- [API documentation](#api-documentation)
- [Architecture overview](#architecture-overview)
- [Key implementation decisions](#key-implementation-decisions)
- [Assumptions](#assumptions)
- [Future improvements](#future-improvements)
- [CI/CD](#cicd)
- [Docker](#docker)
- [Deployment](#deployment)

## Setup instructions

### Prerequisites

- Node.js 18+ and npm
- A MongoDB instance — local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Database

**Local:**
```bash
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
```
The default `mongodb://127.0.0.1:27017/task-tracker` works as-is.

**Atlas:** create a free cluster, add a database user, allow your IP (or
`0.0.0.0/0`), and copy the connection string into `MONGO_URI` below.
Mongoose creates collections and indexes automatically.

### Backend

```bash
cd backend
cp .env.example .env   # set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN
npm install
npm run dev             # http://localhost:5000
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | API port | `5000` |
| `NODE_ENV` | `development` \| `production` \| `test` | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/task-tracker` |
| `JWT_SECRET` | Long random secret used to sign JWTs | — |
| `JWT_EXPIRES_IN` | Token lifetime | `1d` |
| `CLIENT_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the REST API | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Base URL of the Socket.IO server | `http://localhost:5000` |

Open http://localhost:5173, register an account, and start creating tasks.
Open a second tab logged in as the same user to see real-time updates apply
without a refresh.

## Running tests

```bash
cd backend
npm test
```

Uses [`mongodb-memory-server`](https://github.com/typegoose/mongodb-memory-server)
for an in-memory MongoDB, so no external database is needed. Covers:

- Registration, login, duplicate email handling, input validation
- JWT verification on protected routes
- Task CRUD operations
- Role-based access control (a user can't access another user's task; an
  admin can access and list all tasks)
- Pagination and status filtering on the task list endpoint

## API documentation

Import into Postman from `postman/`:
- `TaskTracker.postman_collection.json`
- `TaskTracker.postman_environment.json`

Running **Register User** and **Register Admin** first auto-populates the
`userToken`, `adminToken`, `userId`, and `taskId` variables via test
scripts, so the rest of the requests work out of the box.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Log in, receive a JWT |
| GET | `/api/auth/me` | Authenticated | Get the current user's profile |
| POST | `/api/tasks` | Authenticated | Create a task (owned by the caller) |
| GET | `/api/tasks` | Authenticated | List tasks — paginated, filterable |
| GET | `/api/tasks/:id` | Owner/Admin | Get a single task |
| PUT | `/api/tasks/:id` | Owner/Admin | Update a task |
| DELETE | `/api/tasks/:id` | Owner/Admin | Delete a task |
| GET | `/api/users` | Admin only | List users (populates the admin owner-filter dropdown) |
| GET | `/health` | Public | Health check |

`GET /api/tasks` query params: `page`, `limit` (max 100), `status`
(`pending` \| `in-progress` \| `completed`), `owner` (admin-only).

## Architecture overview

```
┌────────────┐    REST (JWT)    ┌──────────────┐    ┌───────────┐
│   React    │ ───────────────▶ │   Express    │ ──▶ │  MongoDB  │
│  (Vite)    │ ◀─────────────── │     API      │ ◀── │           │
└────────────┘                  └──────────────┘    └───────────┘
      ▲                                │
      │        Socket.IO (JWT)         │
      └────────────────────────────────┘
```

- **Backend** is layered: `routes` → `middleware` (auth, validation) →
  `controllers` → `models`. `app.js` builds the Express app separately from
  `server.js` so tests can exercise it directly without opening a real port.
- **Real-time updates** use Socket.IO with JWT handshake authentication.
  Each socket joins a private `user:<id>` room; admins also join `admins`.
  Task mutations emit to both, so affected clients update automatically.
  The frontend simply re-fetches the current page on any event — trading a
  small amount of network overhead for correctness across filters and
  pagination.
- **Auth** is stateless JWT (`Authorization: Bearer <token>`), verified on
  both REST requests and the Socket.IO handshake.
- **RBAC** is enforced in the controllers: regular users' queries are
  scoped to `owner: req.user._id`; admins bypass that scope. Object-level
  checks guard `GET/PUT/DELETE /tasks/:id` so a user can't access another
  user's task by guessing its id.

## Key implementation decisions

- **Stateless JWT** instead of sessions, so one token authenticates both
  REST calls and the Socket.IO handshake.
- **Re-fetch-on-event** for real-time sync rather than patching individual
  tasks from socket payloads — simpler and correctness-preserving for
  filtering/pagination.
- **Ownership scoping in the query itself**, not filtered in application
  code, so the database never returns rows a user shouldn't see.
- **Centralized error handling** via one Express middleware and an
  `ApiError` class, so every endpoint returns a consistent
  `{ success, message, details? }` shape.
- **In-memory MongoDB for tests** so the suite is hermetic and needs no
  running database or network access.

## Assumptions

- **Open admin registration** — `POST /api/auth/register` accepts an
  optional `role: "admin"` for reviewer convenience. A real product would
  provision admins out-of-band instead.
- **Task ownership is fixed at creation** and can't be transferred via
  update (admins can still edit/delete any task's other fields).
- **Status values** are `pending`, `in-progress`, `completed` — a minimal
  common set, since the spec left this open.
- **Real-time scope**: updates go to the task's owner and all admins, the
  only two audiences with visibility under this RBAC model.
- **Pagination**: `limit` defaults to 10, capped at 100.

## Future improvements

- Refresh tokens / token rotation
- Optimistic UI updates instead of waiting for the socket round-trip
- Task comments/activity log, due-date notifications
- Server-side sorting options
- E2E tests (Playwright/Cypress) alongside the current API-level suite

## CI/CD

- **CI** (`.github/workflows/ci.yml`) runs on every push/PR: backend lint +
  Jest tests (Node 18 & 20 matrix), frontend lint + production build.
- **CD** (`.github/workflows/cd.yml`) runs after CI succeeds on `main`:
  builds and pushes both Docker images to GitHub Container Registry, then
  deploys the backend to Azure (gated behind the `ENABLE_AZURE_DEPLOY` repo
  variable — see [Deployment](#deployment)). The frontend redeploys via
  Vercel's own GitHub integration, so it needs no job here.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

| Service | URL | Notes |
|---|---|---|
| `frontend` | http://localhost:5173 | Vite build served by Nginx |
| `backend` | http://localhost:5000 | Express API |
| `mongo` | localhost:27017 | MongoDB 7, persisted volume |

`VITE_API_URL`/`VITE_SOCKET_URL` are build-time args for the frontend image
(Vite inlines env vars at build time) — set them before `docker compose
build`, not after. Tear down with `docker compose down -v`.

## Deployment

This is a monorepo — Azure and Vercel each point at their own subfolder of
the same repo.

**Backend — Azure App Service (Web App for Containers)**

Chosen because Socket.IO needs a host that keeps connections open, which
Azure App Service supports directly.

1. Create an App Service Plan (Linux) + Web App for Containers.
2. Configuration → General settings → **Web sockets: On**.
3. Configuration → Application settings: `MONGO_URI`, `JWT_SECRET`,
   `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (your Vercel URL), `WEBSITES_PORT=5000`.
4. Download the publish profile → add as GitHub secrets
   `AZURE_WEBAPP_PUBLISH_PROFILE` and `AZURE_WEBAPP_NAME`.
5. Set the repo variable `ENABLE_AZURE_DEPLOY=true`.
6. Push to `main` — CD builds the image and deploys it automatically.

`render.yaml` is included as an alternative to Azure.

**Frontend — Vercel**

1. Import the repo → **Project Settings → General → Root Directory** →
   `frontend`.
2. Add `VITE_API_URL` and `VITE_SOCKET_URL` as environment variables,
   pointing at the deployed Azure URL.
3. Deploy — Vercel redeploys automatically on every push after this.

**Self-hosted alternative:** `docker-compose.yml` at the repo root runs
MongoDB + backend + frontend together on any Docker host.
