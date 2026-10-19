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

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL
- NextAuth.js (single-user credentials)
- Zod + TanStack Query
- OpenRouter (LLM orchestration, ordered model fallback)
- Postgres-backed job queue + worker process for background pipeline runs

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

## Getting started

Not yet scaffolded — this repo currently holds only the planning documents.
After scaffolding: `docker compose up` + `npm run dev`.
