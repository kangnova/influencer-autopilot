# SPEC — Influencer Autopilot (Technical)

Technical specification: data model, API contract, business rules, connector
interfaces, and testing strategy. Product rationale lives in `docs/PRD.md`.

## 1. Data Model (Prisma schema)

```prisma
enum Role { OPERATOR }

enum Status { DRAFT READY SCHEDULED PUBLISHED FAILED ARCHIVED }

enum MediaKind { IMAGE VIDEO }

enum Platform { INSTAGRAM }

enum JobType {
  NICHE_RESEARCH
  PERSONA_GENERATE
  COURSE_SCRIPTS
  CONTENT_PLAN
  VIDEO_PROMPTS
  MEDIA_IMPORT
}

enum JobStatus { PENDING RUNNING SUCCEEDED FAILED }

model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  role     Role   @default(OPERATOR)
  createdAt DateTime @default(now())
}

model Niche {
  id               String   @id @default(cuid())
  name             String
  description      String?
  monetizationScore Int     @default(0)
  status           Status   @default(DRAFT)
  researchNotes    String?
  salesLinkUrl     String?
  createdAt        DateTime @default(now())
  personas         Persona[]
  courses          Course[]
  contentPlans     ContentPlan[]
}

model Persona {
  id            String  @id @default(cuid())
  nicheId       String
  niche         Niche   @relation(fields: [nicheId], references: [id])
  name          String
  masterPrompt  String
  avatarImageUrl String?
  identity      String? // appearance/personality/voice/visual-consistency notes
  status        Status  @default(DRAFT)
  createdAt     DateTime @default(now())
  mediaAssets   MediaAsset[]
}

model Course {
  id               String  @id @default(cuid())
  nicheId          String
  niche            Niche   @relation(fields: [nicheId], references: [id])
  title            String
  problemStatement String?
  status           Status  @default(DRAFT)
  createdAt        DateTime @default(now())
  lessons          Lesson[]
}

model Lesson {
  id           String  @id @default(cuid())
  courseId     String
  course       Course  @relation(fields: [courseId], references: [id])
  title        String
  script       String?
  videoPrompt  String?
  order        Int     @default(0)
  status       Status  @default(DRAFT)
  mediaAssetId String? @unique
  mediaAsset   MediaAsset? @relation(fields: [mediaAssetId], references: [id])
}

model ContentPlan {
  id        String  @id @default(cuid())
  nicheId   String
  niche     Niche   @relation(fields: [nicheId], references: [id])
  title     String
  dayCount  Int     @default(30)
  status    Status  @default(DRAFT)
  createdAt DateTime @default(now())
  items     ContentItem[]
}

model ContentItem {
  id           String   @id @default(cuid())
  planId       String
  plan         ContentPlan @relation(fields: [planId], references: [id])
  dayIndex     Int
  hook         String?
  script       String?
  videoPrompt  String?
  status       Status   @default(DRAFT)
  scheduledAt  DateTime?
  mediaAssetId String?  @unique
  mediaAsset   MediaAsset? @relation(fields: [mediaAssetId], references: [id])
  posts        Post[]
}

model MediaAsset {
  id        String    @id @default(cuid())
  url       String
  kind      MediaKind
  source    String    @default("MANUAL") // MANUAL | HIGGSFIELD | <provider>
  status    Status    @default(READY)
  createdAt DateTime  @default(now())
  personaId String?
  persona   Persona?  @relation(fields: [personaId], references: [id])
  Lesson    Lesson?
  ContentItem ContentItem?
}

model SocialAccount {
  id          String   @id @default(cuid())
  platform    Platform @default(INSTAGRAM)
  handle      String
  accountType String   @default("BUSINESS") // BUSINESS | CREATOR
  accessToken String   // encrypted at rest; never returned to the client
  status      Status   @default(DRAFT)
  createdAt   DateTime @default(now())
  posts       Post[]
}

model Post {
  id             String        @id @default(cuid())
  contentItemId  String?
  contentItem    ContentItem?  @relation(fields: [contentItemId], references: [id])
  socialAccountId String
  socialAccount  SocialAccount @relation(fields: [socialAccountId], references: [id])
  caption        String?
  status         Status        @default(DRAFT)
  approved       Boolean       @default(false)
  scheduledAt    DateTime?
  publishedAt    DateTime?
  externalPostId String?       // Instagram media ID after publish
  createdAt      DateTime      @default(now())
  metrics        Metric[]
}

model Metric {
  id          String   @id @default(cuid())
  postId      String
  post        Post     @relation(fields: [postId], references: [id])
  date        DateTime @default(now())
  impressions Int      @default(0)
  reach       Int      @default(0)
  likes       Int      @default(0)
  comments    Int      @default(0)
  shares      Int      @default(0)
  clicks      Int      @default(0)
  sales       Int      @default(0)
}

model Job {
  id        String    @id @default(cuid())
  type      JobType
  payload   Json
  status    JobStatus @default(PENDING)
  result    Json?
  error     String?
  attempts  Int       @default(0)
  createdAt DateTime  @default(now())
  startedAt DateTime?
  doneAt    DateTime?
}
```

Notes:
- `accessToken` is encrypted with a server-side key before write and decrypted only
  server-side; API responses return only a `connected: true` flag.
- The queue is the `Job` table itself; the worker claims rows with
  `SELECT ... FOR UPDATE SKIP LOCKED` and updates status/attempts.

## 2. API Contract

All JSON routes return a consistent envelope. Errors are HTTP status + `{ ok, error }`.

### Standard envelope
```json
{ "ok": true, "data": { } }
{ "ok": false, "error": { "message": "..." } }
```

### Pipeline
| Method | Path | Request | Response |
|---|---|---|---|
| POST | `/api/pipeline/run` | `{ type, payload }` | `{ job }` (id + status) |
| GET | `/api/jobs/[id]` | — | `{ job }` incl. result/error |
| GET | `/api/jobs?status=PENDING` | — | `{ jobs }` |

### Resources (pattern applies to niches/personas/courses/lessons/content-plans/content-items/media/posts)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/<res>` | ✓ | list, ordered by createdAt desc |
| POST | `/api/<res>` | ✓ | create (Zod-validated) |
| GET | `/api/<res>/[id]` | ✓ | read one |
| PATCH | `/api/<res>/[id]` | ✓ | partial update |
| DELETE | `/api/<res>/[id]` | ✓ | soft-delete → `ARCHIVED` |

### Publishing
| Method | Path | Notes |
|---|---|---|
| POST | `/api/social-accounts` | store handle + token (encrypted), verify via Graph API `/me` |
| POST | `/api/posts` | create a post for a content item |
| POST | `/api/posts/[id]/approve` | flip `approved`; if auto-publish is on, trigger publish |
| POST | `/api/posts/[id]/publish` | publish via connector; set externalPostId + publishedAt |
| GET | `/api/metrics` | funnel rollup per content item / niche |

## 3. Business Rules

- **BR-1 Ordering:** niche must be picked before a persona can be created; persona
  before production; production before publishing. The UI enforces this by gating
  next-step buttons on the previous step's status.
- **BR-2 Single active niche:** only one niche is `active` at a time for pipeline
  runs; picking a new niche does not delete the old one's data.
- **BR-3 Approval gate:** a post with `status = SCHEDULED` and `approved = false`
  will not publish. Auto-publish is an explicit account-level opt-in that renders a
  risk warning (Instagram ToS).
- **BR-4 Job idempotency:** re-running a completed job creates a NEW job; a job
  mid-run is never duplicated (claim uses SKIP LOCKED).
- **BR-5 LLM fallback:** LLM calls use an ordered model list (deepseek →
  llama-3.3-70b → qwen-2.5-72b) and fall through on HTTP 429 or empty content;
  if all fail, the job records `error` and does not fabricate output.
- **BR-6 Token cost:** every job stores the model used + token estimate in `result`
  so cost is visible per run.

## 4. Connector Interfaces

### VideoProvider (MVP = manual; later HeyGen/D-ID/Replicate)
```ts
interface VideoProvider {
  // Generate a video from a Higgsfield-style prompt; returns a provider job/asset id.
  generate(prompt: string, options: { avatarId?: string; lengthS?: number }): Promise<{ externalId: string }>;
  // Poll until done; returns a downloadable media URL.
  status(externalId: string): Promise<{ status: "processing" | "ready" | "failed"; mediaUrl?: string }>;
}
```
MVP implementation (`ManualImportProvider`) does not generate; it accepts a
user-uploaded file and records `source = "HIGGSFIELD"`.

### SocialProvider (Instagram)
```ts
interface SocialProvider {
  connect(token: string): Promise<{ handle: string; accountType: string }>;
  publish(post: { caption: string; mediaUrl: string }): Promise<{ externalPostId: string }>;
  insights(externalPostId: string): Promise<{ impressions: number; reach: number; likes: number; comments: number; shares: number }>;
}
```
Implemented over the Instagram Graph API for a Business/Creator account. Publishing
is gated by BR-3.

### ImageProvider (avatar) — optional
```ts
interface ImageProvider {
  generate(prompt: string): Promise<{ imageUrl: string }>;
}
```

## 5. Environment / Config

```
DATABASE_URL=postgres://...
OPENROUTER_API_KEY=sk-or-...
INSTAGRAM_ACCESS_TOKEN=...     # optional; also storable per account (encrypted)
ENCRYPTION_KEY=...             # server-side key for token encryption
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

## 6. Testing Strategy

- **Unit (Vitest):** Zod schemas, job-claim SQL, LLM fallback logic (mocked HTTP),
  funnel rollup math.
- **Integration:** Prisma CRUD against a test database; job worker round-trip
  (enqueue → claim → complete → result read-back).
- **E2E (Playwright, smoke):** login → create niche → pick → create persona → create
  course → add lesson → create content plan → add item → queue post → approve →
  assert statuses.
- **Contract:** connector interfaces tested against a fake provider (no live
  external calls in CI).
