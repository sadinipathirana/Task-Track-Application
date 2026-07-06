# Task Tracker

A full-stack task tracking application with authentication, role-based access
control, real-time updates, and a REST API.

**Stack:** React + Vite (frontend) · Node.js + Express (backend) · MongoDB
(database) · JWT (auth) · Socket.IO (real-time) · Jest + Supertest (testing) ·
GitHub Actions (CI)

```
task-tracker/
├── backend/          Express API, MongoDB models, Socket.IO, tests
├── frontend/         React + Vite single-page app
├── postman/          Postman collection + environment
└── .github/workflows CI pipeline (lint + test on push/PR)
```

## Table of contents

- [Setup instructions](#setup-instructions)
- [Running tests](#running-tests)
- [API documentation](#api-documentation)
- [Architecture overview](#architecture-overview)
- [Key implementation decisions](#key-implementation-decisions)
- [Assumptions](#assumptions)
- [Future improvements](#future-improvements)
- [CI pipeline](#ci-pipeline)
- [Containerization (Docker)](#containerization-docker)
- [Deployment](#deployment)
- [Continuous Deployment (CD)](#continuous-deployment-cd)

## Setup instructions

### Prerequisites

- Node.js 18+ and npm
- A MongoDB instance — either local (`mongod`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Database setup

**Option A — local MongoDB**

```bash
# macOS (Homebrew)
brew tap mongodb/brew && brew install mongodb-community
brew services start mongodb-community
# The default connection string mongodb://127.0.0.1:27017/task-tracker will work as-is.
```

**Option B — MongoDB Atlas**

1. Create a free cluster at https://cloud.mongodb.com.
2. Create a database user and allow your IP (or `0.0.0.0/0` for testing).
3. Copy the connection string and use it as `MONGO_URI` below.

No manual schema creation is needed — Mongoose creates collections and
indexes automatically on first write.

### Backend setup

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN as needed
npm install
npm run dev        # starts on http://localhost:5000 with nodemon
# or: npm start     # production start
```

Backend environment variables (`backend/.env`):

| Variable          | Description                                   | Example                                    |
|-------------------|------------------------------------------------|---------------------------------------------|
| `PORT`            | Port the API listens on                        | `5000`                                       |
| `NODE_ENV`        | `development` \| `production` \| `test`         | `development`                                |
| `MONGO_URI`       | MongoDB connection string                       | `mongodb://127.0.0.1:27017/task-tracker`     |
| `JWT_SECRET`      | Secret used to sign JWTs — use a long random value | `super-long-random-string`                |
| `JWT_EXPIRES_IN`  | Token lifetime                                  | `1d`                                          |
| `CLIENT_ORIGIN`   | Allowed CORS origin(s), comma-separated         | `http://localhost:5173`                      |

### Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if the API isn't on the default host/port
npm install
npm run dev         # starts on http://localhost:5173
```

Frontend environment variables (`frontend/.env`):

| Variable            | Description                     | Example                          |
|---------------------|----------------------------------|-----------------------------------|
| `VITE_API_URL`      | Base URL of the REST API         | `http://localhost:5000/api`      |
| `VITE_SOCKET_URL`   | Base URL of the Socket.IO server | `http://localhost:5000`          |

### Quick start (both servers)

```bash
# terminal 1
cd backend && npm install && npm run dev

# terminal 2
cd frontend && npm install && npm run dev
```

Then open http://localhost:5173, register an account, and start creating
tasks. Open a second browser tab (or window) logged in as the same user to
see real-time updates propagate without a refresh.

> **Note on registering an admin:** for ease of grading, the registration
> form and API let a caller register directly with `role: "admin"` (see
> [Assumptions](#assumptions)). In a production system, admin roles would be
> granted by an existing admin or through an internal process, not
> self-service at signup.

## Running tests

```bash
cd backend
npm test
```

Tests use [`mongodb-memory-server`](https://github.com/typegoose/mongodb-memory-server)
to spin up an in-memory MongoDB instance, so no external database is
required to run the suite. Coverage includes:

- Registration, login, duplicate email handling, input validation
- JWT verification on protected routes
- Task CRUD operations
- Role-based access control (a regular user cannot access another user's
  task; an admin can access and list all tasks)
- Pagination and status filtering on the task list endpoint

## API documentation

Import the Postman collection and environment from `postman/`:

- `TaskTracker.postman_collection.json`
- `TaskTracker.postman_environment.json`

The collection is organized into **Auth**, **Tasks**, and **Health** folders
and covers every implemented endpoint. Running "Register User" and "Register
Admin" first automatically populates the `userToken`, `adminToken`, `userId`,
and `taskId` collection variables via test scripts, so the rest of the
requests work out of the box with minimal setup.

### Endpoint summary

| Method | Endpoint            | Access        | Description                                  |
|--------|----------------------|---------------|-----------------------------------------------|
| POST   | `/api/auth/register`| Public        | Register a new user                           |
| POST   | `/api/auth/login`   | Public        | Log in, receive a JWT                         |
| GET    | `/api/auth/me`      | Authenticated | Get the current user's profile                |
| POST   | `/api/tasks`        | Authenticated | Create a task (owned by the caller)           |
| GET    | `/api/tasks`        | Authenticated | List tasks — paginated, filterable            |
| GET    | `/api/tasks/:id`    | Owner/Admin   | Get a single task                             |
| PUT    | `/api/tasks/:id`    | Owner/Admin   | Update a task                                 |
| DELETE | `/api/tasks/:id`    | Owner/Admin   | Delete a task                                 |
| GET    | `/api/users`        | Admin only    | List all users (used to populate the admin's "filter by owner" dropdown) |
| GET    | `/health`           | Public        | Health check                                  |

`GET /api/tasks` query parameters: `page`, `limit` (max 100), `status`
(`pending` \| `in-progress` \| `completed`), and `owner` (admin-only, filters
by a specific user's id).

## Architecture overview

```
┌────────────┐        REST (JWT)        ┌──────────────┐        ┌───────────┐
│   React    │ ───────────────────────▶ │   Express    │ ─────▶ │  MongoDB  │
│  (Vite)    │ ◀─────────────────────── │     API      │ ◀───── │           │
└────────────┘                          └──────────────┘        └───────────┘
      ▲                                        │
      │            Socket.IO (JWT auth)        │
      └────────────────────────────────────────┘
```

- **Backend** is a layered Express app: `routes` → `middleware` (auth,
  validation) → `controllers` → `models`. `app.js` builds the Express app in
  isolation from the HTTP/Socket.IO server so it can be imported directly in
  tests without opening a real port.
- **Real-time updates** use Socket.IO with JWT-based handshake
  authentication. On connect, a socket joins a private room `user:<id>`; if
  the user is an admin, it also joins an `admins` room. Task mutations
  (create/update/delete) emit to the owner's room and the `admins` room, so
  every affected client refreshes automatically. The frontend's `useTasks`
  hook simply re-fetches the current page on any of these events — trading a
  small amount of network overhead for correctness (filters, pagination, and
  sort order can't drift out of sync from a partial client-side merge).
- **Auth** uses stateless JWTs (`Authorization: Bearer <token>`) verified on
  both REST requests (Express middleware) and Socket.IO connections
  (handshake middleware), so both channels share one identity source.
- **RBAC** is enforced at the controller layer: regular users' queries are
  always scoped to `owner: req.user._id`; admins bypass that scope and may
  additionally filter by any `owner`. Object-level checks (`assertCanAccess`)
  guard `GET/PUT/DELETE /tasks/:id` so a user can't access another user's
  task by guessing its id.
- **Frontend** is a small React SPA (React Router for pages, Context for
  auth/session and the socket connection, a thin Axios wrapper with a
  response interceptor that clears the session on `401`).

## Key implementation decisions

- **Stateless JWT auth** rather than sessions, so the same token can
  authenticate both REST calls and the Socket.IO handshake without a shared
  session store.
- **Re-fetch-on-event** for real-time sync instead of patching individual
  tasks into client state from socket payloads. This is simpler and
  correctness-preserving for filtering/pagination, at the cost of an extra
  request per change — an acceptable trade-off for a task tracker's update
  volume.
- **Ownership scoping in the query itself** (`filter.owner = req.user._id`)
  rather than fetching everything and filtering in application code, so the
  database only ever returns rows a user is allowed to see.
- **Centralized error handling** via a single Express error-handling
  middleware and a small `ApiError` class, so every endpoint returns a
  consistent `{ success, message, details? }` shape and Mongoose errors
  (cast errors, validation errors, duplicate keys) are translated to
  sensible HTTP status codes in one place.
- **`app.js` separated from `server.js`** purely for testability — Supertest
  can exercise the Express app directly without binding a real port or
  starting Socket.IO.
- **In-memory MongoDB for tests** (`mongodb-memory-server`) so the test
  suite is hermetic and doesn't depend on a running local database or
  network access.

## Assumptions

- **Open admin registration.** The spec doesn't describe an admin
  provisioning flow, so for reviewer convenience `POST /api/auth/register`
  accepts an optional `role: "admin"`. A real product would remove this and
  provision admins out-of-band (invite flow, existing-admin action, or a
  seed script).
- **Task ownership is fixed at creation** to the authenticated caller;
  ownership cannot be transferred via the update endpoint (admins can still
  edit/delete any task's other fields).
- **Status values** are limited to `pending`, `in-progress`, `completed` —
  the spec left the exact set open, and this is a common minimal set for a
  task tracker.
- **Real-time scope**: updates are pushed to the task's owner and to all
  admins, since those are the only two audiences with visibility into a
  given task under the RBAC model described.
- **Pagination defaults**: `limit` defaults to 10 and is capped at 100 to
  protect the API from unbounded queries.

## Future improvements

- Refresh tokens / token rotation instead of a single long-lived access
  token.
- Rate limiting on auth endpoints (`express-rate-limit`) to reduce
  brute-force risk.
- Optimistic UI updates on the frontend (apply the change locally, then
  reconcile with the server) instead of waiting for the socket round-trip.
- Task comments/activity log, and email or push notifications for
  approaching due dates.
- Containerization (Dockerfile + docker-compose for API, frontend, and
  MongoDB) and a CD step that deploys on merge to `main`.
- Server-side sorting options (e.g. by due date) exposed as a query
  parameter.
- E2E tests (Playwright/Cypress) covering the full browser flow, in addition
  to the current API-level Jest/Supertest suite.

## CI pipeline

`.github/workflows/ci.yml` runs on every push and pull request:

- **Backend job**: installs dependencies, runs ESLint, runs the Jest test
  suite (against an in-memory MongoDB, so no secrets or external services
  are needed) — matrixed across Node 18 and 20.
- **Frontend job**: installs dependencies, runs ESLint, and runs a
  production build to catch build-breaking errors.

## Containerization (Docker)

Both services are containerized and orchestrated with Docker Compose,
alongside a MongoDB container — no local Node or MongoDB install required.

```bash
cp .env.example .env   # adjust JWT_SECRET etc. if you like
docker compose up --build
```

This starts:

| Service    | URL                     | Notes                                   |
|------------|--------------------------|------------------------------------------|
| `frontend` | http://localhost:5173    | Vite build served by Nginx (port 80 → 5173) |
| `backend`  | http://localhost:5000    | Express API                              |
| `mongo`    | localhost:27017          | MongoDB 7, data persisted in a named volume |

Notes on the images:

- **`backend/Dockerfile`** — multi-stage Node 20 Alpine build, installs
  production dependencies only, runs as a non-root user, and exposes a
  container `HEALTHCHECK` against `/health`.
- **`frontend/Dockerfile`** — multi-stage build: Vite builds the static
  bundle in a Node stage, then an Nginx Alpine stage serves it.
  `VITE_API_URL`/`VITE_SOCKET_URL` are **build-time** args (Vite inlines env
  vars at build time), so they must be set before `docker compose build`,
  not at container start.
- `docker-compose.yml` waits for Mongo's healthcheck before starting the
  backend, and the backend before the frontend.

To rebuild after a code change: `docker compose up --build`. To tear down
(including the Mongo volume): `docker compose down -v`.

## Deployment

This is a monorepo, so both platforms below are pointed at a **subfolder**
of the same repo — you push once, to one GitHub repo, and each platform
only looks at its own half.

**Backend — Azure App Service (Web App for Containers)**

Chosen because Socket.IO needs a host that keeps connections open, which
Azure App Service supports directly (unlike fully serverless platforms).

1. In the Azure Portal: create an **App Service Plan (Linux)** and a
   **Web App → for Containers**.
2. **Configuration → General settings → Web sockets: On** — required for
   Socket.IO.
3. **Configuration → Application settings**, add: `MONGO_URI` (a MongoDB
   Atlas connection string — Azure doesn't offer managed MongoDB),
   `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (your Vercel frontend
   URL), and `WEBSITES_PORT=5000`.
4. Download the app's **publish profile** (Overview → "Get publish
   profile") and add it as the GitHub repo secret
   `AZURE_WEBAPP_PUBLISH_PROFILE`; add the app's name as the secret
   `AZURE_WEBAPP_NAME`.
5. Set the repo **variable** `ENABLE_AZURE_DEPLOY=true` (Settings → Secrets
   and variables → Actions → Variables tab).
6. Push to `main` — `.github/workflows/cd.yml` builds the backend's Docker
   image from `./backend`, publishes it to GitHub Container Registry, and
   deploys it to your Web App automatically.

> Single-instance deployment is the simplest correct setup for Socket.IO. If
> you later scale to multiple instances, also enable **ARR Affinity**
> (sticky sessions) or add Socket.IO's Redis adapter.

`render.yaml` is included as an alternative if you'd rather use Render
instead of Azure — see the comment at the top of that file.

**Frontend — Vercel**

1. Import this repo in Vercel as a new project.
2. In **Project Settings → General → Root Directory**, set it to
   `frontend`. This tells Vercel to only build/deploy that subfolder, even
   though the repo also contains the backend.
3. Vercel auto-detects `frontend/vercel.json` and the Vite framework.
4. Add `VITE_API_URL` and `VITE_SOCKET_URL` as **Project → Settings →
   Environment Variables**, pointing at your deployed Azure backend URL
   (e.g. `https://task-tracker-api.azurewebsites.net`).
5. Push to your default branch — Vercel's GitHub integration builds and
   deploys automatically on every push. No GitHub Actions workflow is
   needed for this half; `frontend`'s lint/build is still checked by this
   repo's own CI on every push/PR, ahead of Vercel's build.

**Alternative — plain Docker host / VPS**

`docker-compose.yml` at the repo root spins up MongoDB + backend + frontend
together on any machine with Docker installed — see
[Containerization](#containerization-docker) below. Useful if you'd rather
self-host everything in one place instead of splitting across
Azure/Vercel/Atlas.

## Continuous Deployment (CD)

`.github/workflows/cd.yml` runs automatically after the CI workflow
succeeds on `main`:

1. **Builds and pushes both Docker images** to GitHub Container Registry
   (`ghcr.io/<repo>-backend` and `ghcr.io/<repo>-frontend`), tagged with
   both `latest` and the commit SHA. This step always runs and requires no
   external secrets — GHCR authenticates using the automatically-provided
   `GITHUB_TOKEN`.
2. **Deploys the backend to Azure**, gated behind the `ENABLE_AZURE_DEPLOY`
   repo variable so it's off by default and never breaks CI for anyone who
   hasn't set up Azure secrets yet (see the Deployment section above for the
   exact secrets needed).

The frontend doesn't have (or need) a deploy job in this workflow — Vercel
redeploys it on every push to the connected branch on its own, once you've
connected the repo with Root Directory set to `frontend`.

## Incomplete / out of scope

Everything in the functional requirements, plus all three optional bonus
items (containerization, deployment config, and CD), is implemented. The one
bonus item intentionally left out is **AI/LLM integration** — nothing in the
spec's core task-tracking flow benefits from it, and adding it just to check
a box felt like it would work against "prioritize quality and clarity over
extra features." If it's specifically of interest, a natural fit would be
an endpoint that drafts a task description from a short title using the
Anthropic API, which could be added without disturbing the existing
architecture.
