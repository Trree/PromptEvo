# Prompt Manager

[中文说明](./README.zh-CN.md)

Prompt Manager is a full-stack app for managing prompt and skill assets in one place.

## Features

- Unified library for `Prompt` and `Skill` assets
- Search, filter, tags, favorites, and recent access
- Version history for prompts
- Hide/delete operations for prompts and skills
- API key protected write operations
- SQLite + Prisma backend

## Tech Stack

- Backend: Fastify + TypeScript + Prisma + SQLite
- Frontend: React + Vite + TanStack Query + Tailwind CSS

## Project Structure

```text
.
├── server/          # Fastify API
├── web/             # React frontend (Vite)
├── prisma/          # Prisma schema
├── deploy/          # systemd service file
└── DEPLOYMENT.md    # production deployment notes
```

## Requirements

- Node.js 20+
- npm 10+

## Local Setup

1. Install dependencies:

```bash
npm ci
npm ci --prefix web
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Generate Prisma client and sync DB schema:

```bash
npm run prisma:generate
npm run db:push
```

4. Start development servers:

```bash
npm run dev
```

- API server: `http://localhost:3000`
- Web app: Vite dev server (default `http://localhost:5173`)

## Build and Run

```bash
npm run build
npm run start
```

## Environment Variables

- `DATABASE_URL`: SQLite connection string
- `PORT`: API server port (default `3000`)
- `HOST`: API server host (default `0.0.0.0`)
- `API_KEY`: if set, write operations require `Authorization: Bearer <API_KEY>`

## API Overview

### Prompts

- `GET /api/prompts`
- `GET /api/prompts/:id`
- `GET /api/prompts/:id/versions`
- `POST /api/prompts` (auth)
- `POST /api/prompts/:id/hide` (auth)
- `DELETE /api/prompts/:id` (auth)

### Skills

- `GET /api/skills`
- `POST /api/skills` (auth)
- `POST /api/skills/:id/hide` (auth)
- `DELETE /api/skills/:id` (auth)

## Production Deployment

### One-Click Deployment (Debian/Ubuntu)

From project root:

```bash
sudo bash deploy/one-click.sh
```

Optional environment overrides:

```bash
sudo API_KEY='your-strong-secret' PORT=3000 HOST=0.0.0.0 bash deploy/one-click.sh
```

The script installs Node.js 20, creates runtime directories, writes `/etc/prompt-manager/prompt-manager.env`, builds the app, and starts the `prompt-manager` systemd service.

See [DEPLOYMENT.md](./DEPLOYMENT.md) and [deploy/prompt-manager.service](./deploy/prompt-manager.service).
