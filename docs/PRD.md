# PRD — Influencer Autopilot

## 1. Overview & Problem Statement

Running a profitable AI-influencer business today requires manually juggling several
disconnected tools: ChatGPT/Claude for research and scripts, Higgsfield for video,
Instagram for posting, and a sales link for monetization. The workflow has 11 steps
across 5 phases, and a skipped or mis-ordered step (e.g. designing the avatar before
choosing the niche, or never actually wiring up distribution) quietly kills the
whole thing.

Influencer Autopilot is a single-user web platform that turns this pipeline into one
automated, ordered system: it drives the LLM (research → persona → scripts → content
plan), holds a media library, schedules Instagram publishing, and tracks the
sales funnel — so the operator runs a repeatable loop instead of a pile of prompts.

**Core insight baked into the design:** "no content creation" is a partial truth. The
platform removes the *filming* burden, not the research/editing/curation burden. The
product is the ordered pipeline + the funnel measurement, not a magic button.

## 2. Goals / Non-Goals

### Goals
- G1. Automate the 5-phase pipeline (research → persona → production → distribution → monetization) as ordered, repeatable jobs.
- G2. Generate niche research, persona prompts, course scripts, and a 30-day content plan via an LLM (OpenRouter), with an ordered fallback so the system survives provider rate limits.
- G3. Keep a single media/video library with per-item status (draft → ready → scheduled → published).
- G4. Schedule and publish to Instagram through a connector, with a human-approval gate.
- G5. Track the funnel (views → clicks → sales) on a dashboard.

### Non-Goals (scope guard)
- **No multi-tenancy.** Single operator, single account.
- **No own video-rendering engine.** Video/image generation uses external providers.
- **No Instagram scraping.** Research uses LLM knowledge + user-supplied competitor handles; scraping is against Instagram ToS.
- **No payment processing.** Sales happen on Lynk.id (or equivalent); the platform stores the link and tracks clicks/sales.

## 3. User Personas

1. **The Operator (primary, single user)** — an Indonesian solopreneur building an
   AI-influencer business to sell digital products. Non-technical, wants a guided
   pipeline, values honest signals over "it's running". Needs: clear next-step
   guidance, a place for everything, and a real read on whether money is coming in.

*(No secondary personas — single-user by design. Admin and operator are the same person.)*

## 4. User Flows

**Flow A — New niche → live avatar (Phases 0–1)**
1. Operator starts a "Niche research" job; provides optional competitor handles.
2. Platform returns ranked niche candidates; operator picks ONE.
3. Operator runs "Generate persona"; platform returns a master prompt + avatar image.
4. Operator approves the persona; it becomes the active persona.

**Flow B — Produce the product (Phase 2, Track A)**
1. Operator creates a course under the active niche.
2. Platform generates pain-point analysis + lesson scripts.
3. For each lesson, platform generates a Higgsfield-ready video prompt.
4. Operator (or a video connector) produces the video; the file lands in the media library and links to the lesson.

**Flow C — Produce 30-day content (Phase 2, Track B)**
1. Operator runs "Analyze viral patterns" (from supplied reference videos/URLs).
2. Platform generates a 30-day content plan (hooks + scripts).
3. For each content item, platform generates a video prompt; videos are produced and stored.

**Flow D — Publish (Phase 3)**
1. Operator connects an Instagram account via the connector.
2. Content items are queued to a publishing schedule.
3. Each publish requires a one-click approval (or an explicit auto-publish opt-in that shows the risk).
4. Platform publishes and records the Instagram post ID + status.

**Flow E — Measure (Phase 4)**
1. Platform pulls post insights (impressions/reach/engagement) via the Instagram connector.
2. Operator records/imports click + sales data for the sales link.
3. Dashboard shows views → clicks → sales per niche/content item.

## 5. Functional Requirements (MoSCoW)

**Must**
- FR-1 Auth: single-user login (NextAuth credentials).
- FR-2 Niche CRUD with status + monetization score + research notes.
- FR-3 Persona CRUD linked to a niche, storing the master prompt + avatar image + status.
- FR-4 Course + Lesson CRUD; lessons carry script + video prompt + linked media + status.
- FR-5 Content Plan + Content Item CRUD; items carry hook + script + video prompt + status + scheduled time.
- FR-6 Media library: upload/store video/image assets, link assets to lessons/content items.
- FR-7 LLM pipeline jobs: enqueue + run research/persona/scripts/plan generation via OpenRouter with ordered fallback; each job records status + output + error.
- FR-8 Social account connector (Instagram) with connect + schedule + publish + insights.
- FR-9 Post queue with per-post status (draft/scheduled/published) and approval gate.
- FR-10 Metrics dashboard: impressions/reach/engagement/clicks/sales per content item.
- FR-11 Sales link per niche (Lynk.id or similar).

**Should**
- FR-12 Avatar image generation via a pluggable image provider.
- FR-13 Auto-publish mode (opt-in, with a visible account-risk warning).
- FR-14 Email/summary export of a content plan.

**Could**
- FR-15 Video generation via an API provider (HeyGen/D-ID/Replicate) behind the connector interface.
- FR-16 A/B hook variants per content item.

**Won't (this phase)**
- FR-17 Multi-tenant/SaaS accounts.
- FR-18 Native payment processing.

## 6. Non-Functional Requirements

- **Cost visibility:** every LLM/image/video call is attributed to a job and surfaced; no silent token burn.
- **Resilience:** LLM calls fall through an ordered model list; a provider 429/empty response does not kill the pipeline.
- **Security:** secrets (OpenRouter key, Instagram tokens) in env/config, never in the DB or client; OWASP basics (auth-guarded routes, Zod validation, CSRF via NextAuth).
- **Reliability:** jobs are idempotent and resumable; a crashed worker does not lose queue state (Postgres-backed queue).
- **Observability:** job history with status + error; per-post publish results.
- **Availability:** single-user tool, so high-availability is not required; a single VPS/container is sufficient (SLO best-effort).

## 7. Database Schema (summary — full DDL in docs/SPEC.md)

- `User` — auth identity.
- `Niche` — name, description, monetizationScore, status, researchNotes, salesLinkUrl.
- `Persona` — nicheId, name, masterPrompt, avatarImageUrl, identity fields, status.
- `Course` — nicheId, title, problemStatement, status.
- `Lesson` — courseId, title, script, videoPrompt, status, order, mediaAssetId.
- `ContentPlan` — nicheId, title, dayCount, status.
- `ContentItem` — planId, dayIndex, hook, script, videoPrompt, status, mediaAssetId, scheduledAt.
- `MediaAsset` — url, kind (IMAGE/VIDEO), source, status.
- `SocialAccount` — platform (INSTAGRAM), handle, accountType, accessToken (encrypted), status.
- `Post` — contentItemId, platform, caption, status, scheduledAt, publishedAt, externalPostId, approval.
- `Metric` — postId, date, impressions, reach, likes, comments, shares, clicks, sales.
- `Job` — type, payload (json), status, result (json), error, attempts, timestamps.

## 8. API Endpoints (summary — full contract in docs/SPEC.md)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/...` | — | NextAuth (credentials) |
| GET/POST | `/api/niches` | ✓ | list/create niches |
| GET/PATCH/DELETE | `/api/niches/[id]` | ✓ | read/update/delete |
| GET/POST | `/api/personas` | ✓ | list/create personas |
| GET/PATCH | `/api/personas/[id]` | ✓ | read/update |
| GET/POST | `/api/courses` | ✓ | list/create courses |
| POST | `/api/courses/[id]/lessons` | ✓ | add lesson |
| GET/POST | `/api/content-plans` | ✓ | list/create plans |
| POST | `/api/content-plans/[id]/items` | ✓ | add content item |
| GET/POST | `/api/media` | ✓ | list/upload assets |
| GET/POST | `/api/posts` | ✓ | list/create/queue posts |
| POST | `/api/posts/[id]/approve` | ✓ | approve a scheduled post |
| POST | `/api/pipeline/run` | ✓ | enqueue a pipeline job |
| GET | `/api/jobs/[id]` | ✓ | job status |
| POST | `/api/social-accounts` | ✓ | connect Instagram |
| GET | `/api/metrics` | ✓ | funnel metrics |

## 9. Tech Stack Recommendation

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript strict + Tailwind + shadcn/ui | Matches operator's existing stack (portfolio consistency); SSR for auth-gated pages. |
| Data fetch | TanStack Query | Caches/refetches job status and metrics without hand-rolled state. |
| Backend | Next.js Route Handlers + Zod | One codebase, typed validation at the edge. |
| DB | PostgreSQL + Prisma | Relational pipeline (niche→persona→course→lesson, plan→item→post); Prisma matches stack. |
| Auth | NextAuth.js (credentials) | Single user; no OAuth provider burden. |
| LLM | OpenRouter | Operator already has a key; ordered model fallback keeps the pipeline alive through rate limits. |
| Jobs | Postgres-backed `Job` table + Node worker (`SELECT ... FOR UPDATE SKIP LOCKED`) | No Redis/extra infra; durable and resumable. |
| Video/Image | Connector interface — MVP: manual Higgsfield export upload; later: HeyGen/D-ID/Replicate adapter | Higgsfield has no public API; the interface lets the operator swap providers without rework. |
| Instagram | Graph API (Business/Creator account) | Only official path; full browser automation violates ToS. |
| Deploy | VPS/container (single instance) + `docker compose` | Self-contained, matches operator's other projects. |

## 10. Edge Cases & Open Questions

**Constrained / answered**
- Higgsfield has no public API → video generation is a manual import in MVP; the connector interface allows a real API provider later.
- Instagram auto-posting violates ToS and risks account ban → publishing defaults to an approval gate; auto-publish is an explicit opt-in with a warning.
- LLM provider rate limits → ordered fallback + job retry/backoff.
- LLM output not machine-parseable → jobs store raw text + a `parseStatus`; malformed output surfaces as a visible error, not silent data loss.

**Open Questions**
- OQ-1: Which video API provider to adopt post-MVP (HeyGen vs D-ID vs Replicate)? Affects cost model.
- OQ-2: Does the operator have an Instagram Business/Creator account (required for the Graph API)? If only a personal account, publishing stays manual.
- OQ-3: Can Lynk.id provide click/sales data via link/API, or is conversion tracked by manual entry?

## 11. Milestones / Roadmap

- **M1 Foundation:** scaffold, auth, Prisma schema, niche + persona CRUD, media library (manual upload).
- **M2 LLM pipeline:** OpenRouter orchestration for research/persona/scripts/content-plan; job queue + worker; job history UI.
- **M3 Video generation:** Higgsfield prompt generation + manual import; connector interface + one API provider adapter.
- **M4 Distribution:** Instagram connector (connect + schedule + approve-gated publish).
- **M5 Monetization loop:** sales links, metrics dashboard, funnel view.

## 12. Success Metrics

- **Pipeline throughput:** time from niche pick → 30-day content plan generated.
- **Production:** number of lessons/content items produced to `ready` status.
- **Publish:** posts published on schedule; approval-to-publish latency.
- **Funnel:** views → clicks → sales per content item (the decisive metric — the platform "runs" only if this moves).
- **Revenue:** sales attributed per niche/content item.
