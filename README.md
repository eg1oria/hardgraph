# HardGraph

Interactive skill tree builder for any profession. Create beautiful visual graphs of your skills — whether you're a developer, designer, marketer, musician, doctor, or engineer — publish them, and share with the world.

## Features

- **Visual Skill Tree Editor** — drag & drop nodes, connect edges, organize by categories
- **Starter Templates** — 20+ templates across Technology, Design, Business, Creative, and Professional fields
- **Public Profiles** — shareable profile page at `hardgraph.io/username`
- **Public Graphs** — shareable graph page at `hardgraph.io/username/graph-slug`
- **SSR + OG Tags** — server-rendered public pages with full Open Graph metadata
- **Analytics** — view tracking on public graphs
- **Onboarding Flow** — 4-step wizard for new users (profile → field → template → launch)
- **Dark Premium UI** — fully dark theme with indigo/cyan accents

## Tech Stack

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Frontend        | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend         | NestJS 10, TypeScript, Prisma 5                   |
| Database        | PostgreSQL 16                                     |
| Graph Engine    | React Flow (@xyflow/react)                        |
| State           | Zustand 5                                         |
| Animations      | Framer Motion 11                                  |
| Package Manager | pnpm 10 (workspaces)                              |
| Container       | Docker Compose                                    |

## Project Structure

```
hardgraph/
├── apps/
│   ├── web/              # Next.js frontend (port 3000)
│   │   ├── src/app/      # App Router pages
│   │   ├── src/components/  # UI, graph, editor, landing components
│   │   ├── src/hooks/    # useGraph, useNodes, useEdges, useAuthGuard
│   │   ├── src/stores/   # Zustand stores (auth, graph, UI)
│   │   └── src/lib/      # API client, constants, utils
│   └── api/              # NestJS backend (port 4000)
│       ├── src/          # Modules: auth, users, graphs, nodes, edges,
│       │                 #   categories, templates, analytics, billing
│       └── prisma/       # Schema, migrations, seed
├── packages/
│   ├── ui/               # Shared UI primitives
│   ├── config/           # Shared configs
│   └── types/            # Shared TypeScript types
├── docker-compose.yml    # PostgreSQL container
├── .env.example          # Environment variables template
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 (install: `npm i -g pnpm`)
- **Docker** & Docker Compose (for PostgreSQL)

### Setup

```bash
# 1. Clone and install
git clone <repo-url> hardgraph
cd hardgraph
pnpm install

# 2. Environment
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET for production

# 3. Start PostgreSQL
docker compose up -d

# 4. Database setup
pnpm db:generate       # Generate Prisma client
pnpm db:migrate        # Run migrations (creates tables)

# 5. Seed starter templates (optional but recommended)
cd apps/api && npx prisma db seed && cd ../..

# 6. Start development servers
pnpm dev               # Starts both frontend (3000) + backend (4000)
```

### Environment Variables

All variables are defined in `.env.example`. Copy to `.env` and configure:

| Variable               | Required | Default                                                         | Description                           |
| ---------------------- | -------- | --------------------------------------------------------------- | ------------------------------------- |
| `DATABASE_URL`         | ✅       | `postgresql://hardgraph:hardgraph_dev@localhost:5432/hardgraph` | PostgreSQL connection string          |
| `POSTGRES_USER`        | ✅       | `hardgraph`                                                     | Docker PostgreSQL user                |
| `POSTGRES_PASSWORD`    | ✅       | `hardgraph_dev`                                                 | Docker PostgreSQL password            |
| `POSTGRES_DB`          | ✅       | `hardgraph`                                                     | Docker PostgreSQL database name       |
| `JWT_SECRET`           | ✅       | (dev value)                                                     | Secret for JWT signing (min 32 chars) |
| `JWT_EXPIRES_IN`       |          | `7d`                                                            | JWT token expiration                  |
| `API_PORT`             |          | `4000`                                                          | NestJS server port                    |
| `API_URL`              |          | `http://localhost:4000`                                         | Backend URL (used internally)         |
| `NEXT_PUBLIC_API_URL`  | ✅       | `http://localhost:4000`                                         | Backend URL (used by frontend)        |
| `NEXT_PUBLIC_APP_URL`  |          | `http://localhost:3000`                                         | Frontend URL (for OG images)          |
| `GITHUB_CLIENT_ID`     |          |                                                                 | GitHub OAuth client ID (optional)     |
| `GITHUB_CLIENT_SECRET` |          |                                                                 | GitHub OAuth client secret (optional) |
| `GITHUB_CALLBACK_URL`  |          |                                                                 | GitHub OAuth callback URL (optional)  |

### Available Scripts

| Command            | Description                                     |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Start all apps in dev mode (frontend + backend) |
| `pnpm dev:web`     | Start frontend only                             |
| `pnpm dev:api`     | Start backend only                              |
| `pnpm build`       | Build all apps for production                   |
| `pnpm build:web`   | Build frontend only                             |
| `pnpm build:api`   | Build backend only                              |
| `pnpm lint`        | Lint all packages                               |
| `pnpm format`      | Format all files with Prettier                  |
| `pnpm db:generate` | Generate Prisma client from schema              |
| `pnpm db:migrate`  | Run database migrations                         |
| `pnpm db:studio`   | Open Prisma Studio (visual DB browser)          |
| `pnpm clean`       | Clean all build artifacts and caches            |

### Ports

| Service      | Port | URL                              |
| ------------ | ---- | -------------------------------- |
| Frontend     | 3000 | http://localhost:3000            |
| Backend API  | 4000 | http://localhost:4000/api        |
| Health Check | 4000 | http://localhost:4000/api/health |
| PostgreSQL   | 5432 | localhost:5432                   |

## API Endpoints

| Method | Path                      | Auth | Description                |
| ------ | ------------------------- | ---- | -------------------------- |
| POST   | `/api/auth/signup`        | —    | Register new user          |
| POST   | `/api/auth/login`         | —    | Login, returns JWT         |
| GET    | `/api/users/me`           | ✅   | Current user profile       |
| PATCH  | `/api/users/me`           | ✅   | Update profile             |
| GET    | `/api/users/:username`    | —    | Public profile             |
| GET    | `/api/graphs`             | ✅   | User's graphs              |
| POST   | `/api/graphs`             | ✅   | Create graph               |
| GET    | `/api/graphs/:id`         | ✅   | Graph with nodes/edges     |
| PUT    | `/api/graphs/:id`         | ✅   | Update graph               |
| DELETE | `/api/graphs/:id`         | ✅   | Delete graph               |
| GET    | `/api/graphs/explore`     | —    | Recent public graphs       |
| GET    | `/api/public/:user/:slug` | —    | Public graph data          |
| GET    | `/api/templates`          | ✅   | List templates             |
| POST   | `/api/templates/:id/use`  | ✅   | Create graph from template |
| POST   | `/api/analytics/track`    | —    | Track page view            |
| GET    | `/api/analytics/views`    | ✅   | View analytics             |
| GET    | `/api/health`             | —    | Health check               |

## Database Schema

7 tables: **User**, **Graph**, **Node**, **Edge**, **Category**, **Template**, **ProfileView**

Key relationships:

- User → many Graphs
- Graph → many Nodes, Edges, Categories
- Template stores `graphData` (JSON) with nodes, edges, categories

## Deployment Notes

- Set `JWT_SECRET` to a strong random string (32+ chars)
- Set `DATABASE_URL` to your production PostgreSQL
- Set `NEXT_PUBLIC_API_URL` to your production API domain
- Run `pnpm build` to create production builds
- Frontend: deploy `apps/web/.next` (Vercel, Docker, etc.)
- Backend: deploy `apps/api/dist` (Docker, Railway, etc.)

## Production Deploy

### Recommended MVP Stack

| Component | Service                                 | Rationale                                        |
| --------- | --------------------------------------- | ------------------------------------------------ |
| Frontend  | **Vercel** (free)                       | Zero-config Next.js deploy, global CDN, auto-SSL |
| Backend   | **Railway** ($5/mo)                     | Docker deploy, auto-SSL, easy Postgres addon     |
| Database  | **Railway Postgres** or **Neon** (free) | Managed PG, no ops                               |

### Option A: Vercel + Railway (Simplest)

**1. Database (Railway / Neon)**

```bash
# Railway: create project → Add PostgreSQL → copy DATABASE_URL
# Neon: neon.tech → create project → copy connection string
```

**2. Backend → Railway**

```bash
# Push repo to GitHub, connect Railway to the repo
# Set root directory: /
# Set Dockerfile path: apps/api/Dockerfile
# Add environment variables:
#   NODE_ENV=production
#   DATABASE_URL=<from step 1>
#   JWT_SECRET=<openssl rand -hex 32>
#   JWT_EXPIRES_IN=7d
#   API_PORT=4000
#   NEXT_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app

# After deploy, run migrations:
#   railway run npx prisma migrate deploy
#   railway run npx prisma db seed
```

**3. Frontend → Vercel**

```bash
# Connect repo to Vercel
# Framework: Next.js
# Root directory: apps/web
# Add environment variables:
#   NEXT_PUBLIC_API_URL=https://your-api.railway.app
#   NEXT_PUBLIC_APP_URL=https://your-frontend.vercel.app

# Build command: cd ../.. && pnpm install && pnpm build:web
# Output directory: apps/web/.next
```

**4. Post-deploy checklist**

- [ ] Update CORS: set `NEXT_PUBLIC_APP_URL` on Railway to Vercel URL
- [ ] Verify: `curl https://your-api.railway.app/health`
- [ ] Verify: open `https://your-frontend.vercel.app`
- [ ] Test: register → create graph → publish → open public link

### Option B: Full Docker Compose (VPS)

```bash
# 1. Copy env
cp .env.production.example .env.production

# 2. Edit .env.production with real values
#    - Strong POSTGRES_PASSWORD
#    - Strong JWT_SECRET (openssl rand -hex 32)
#    - Real domain URLs

# 3. Deploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Run migrations
docker exec hardgraph-api npx prisma migrate deploy
docker exec hardgraph-api npx prisma db seed

# 5. Put behind a reverse proxy (nginx/Caddy) for SSL
```

### Environment Variables (Production)

See [.env.production.example](.env.production.example) for all required values.

**Critical security settings:**

- `JWT_SECRET` — minimum 32 random characters (`openssl rand -hex 32`)
- `POSTGRES_PASSWORD` — strong unique password
- `NODE_ENV=production` — disables Swagger docs, enables optimizations

### Healthcheck

| Service  | Endpoint      | Expected           |
| -------- | ------------- | ------------------ |
| API      | `GET /health` | `{ status: 'ok' }` |
| Web      | `GET /`       | HTTP 200           |
| Postgres | `pg_isready`  | exit 0             |

All services include Docker healthchecks in `docker-compose.prod.yml`.

## License

Private — All rights reserved.
