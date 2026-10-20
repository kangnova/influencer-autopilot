# Influencer Autopilot

A single-user platform that automates an AI-influencer business end to end: niche
research, persona design, course + viral content production, scheduled Instagram
publishing, and sales tracking — without filming any content.

## What it does

Orchestrates a 5-phase pipeline (full detail in `docs/PRD.md`):

1. **Research** — find and rank profitable Instagram niches.
2. **Persona** — generate a consistent, hyper-realistic AI influencer.
3. **Production** — two parallel tracks: the digital product (course) and traffic
   content (30-day plan), generated from LLM scripts.
4. **Distribution** — schedule and publish content to Instagram.
5. **Monetization** — track the funnel: views → clicks → sales.

## Stack

Present:
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth.js (single-user credentials)
- Zod

Planned (M2+):
- OpenRouter (LLM orchestration, ordered model fallback)
- Postgres-backed job queue + worker process for background pipeline runs
- TanStack Query, shadcn/ui

## Architecture (high level)

```
App (Next.js)  ── UI + API routes + job enqueueing
Worker (Node)  ── polls the Job table, runs LLM calls + media processing
Postgres       ── data + job queue
Connectors     ── pluggable adapters: video gen (Higgsfield manual / HeyGen /
                   D-ID / Replicate) and Instagram (Graph API)
```

See `docs/SPEC.md` for the data model, API contract, and connector interfaces.

## Roadmap

M1 Foundation → M2 LLM pipeline → M3 Video generation → M4 Distribution →
M5 Monetization loop (see `docs/PRD.md` § Milestones).

## Status

- M1 Foundation — done: scaffold, auth, Prisma schema, niche + persona CRUD,
  media library (manual upload).
- M2 LLM pipeline — in progress: OpenRouter orchestration, job queue + worker,
  job history UI.

## Getting started

Prerequisites: Node 20+, Docker (Postgres).

1. Copy `.env.example` to `.env`, fill `DATABASE_URL` and `NEXTAUTH_SECRET`.
2. `docker compose up -d` — Postgres on :5437.
3. `npx prisma migrate deploy && npx prisma db seed` — tables + admin user.
4. `npm run dev` — app on http://localhost:3007.

Default login: `admin@autopilot.local` / `changeme123`.
