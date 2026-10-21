import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { completeWithFallback } from "./openrouter";
import * as prompts from "./prompts";
import { renderPlanSlides } from "./slide-render";

interface JobPayload {
  nicheId?: string;
  personaId?: string;
  competitorHandles?: string[];
  topic?: string;
  dayCount?: number;
}

type HandlerResult = Record<string, unknown>;

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `LLM returned non-JSON output (${text.length} chars). Raw head: ${text.slice(0, 200)}`
    );
  }
}

async function research(job: { payload: JobPayload }): Promise<HandlerResult> {
  const nicheId = job.payload.nicheId;
  if (!nicheId) throw new Error("payload.nicheId is required");
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) throw new Error(`Niche ${nicheId} not found`);

  const { system, user } = prompts.researchPrompt(
    niche.name,
    job.payload.competitorHandles
  );
  const llm = await completeWithFallback({ system, user, json: true });
  const parsed = parseJson<{ niches: unknown[] }>(llm.text);

  await prisma.niche.update({
    where: { id: nicheId },
    data: { researchNotes: JSON.stringify(parsed, null, 2) },
  });

  return {
    model: llm.model,
    promptTokens: llm.promptTokens,
    completionTokens: llm.completionTokens,
    nicheId,
    candidates: Array.isArray(parsed.niches) ? parsed.niches.length : 0,
  };
}

async function persona(job: { payload: JobPayload }): Promise<HandlerResult> {
  const nicheId = job.payload.nicheId;
  if (!nicheId) throw new Error("payload.nicheId is required");
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) throw new Error(`Niche ${nicheId} not found`);

  const { system, user } = prompts.personaPrompt(niche.name);
  const llm = await completeWithFallback({ system, user, json: true });
  const parsed = parseJson<{
    name?: string;
    identity?: string;
    masterPrompt?: string;
    avatarPrompt?: string;
  }>(llm.text);

  const data = {
    name: parsed.name?.trim() || "Unnamed persona",
    identity: parsed.identity || null,
    masterPrompt: parsed.masterPrompt || "",
    status: "READY" as const,
  };

  const persona =
    job.payload.personaId
      ? await prisma.persona.update({ where: { id: job.payload.personaId }, data })
      : await prisma.persona.create({
          data: { nicheId, ...data, avatarImageUrl: null },
        });

  return {
    model: llm.model,
    promptTokens: llm.promptTokens,
    completionTokens: llm.completionTokens,
    personaId: persona.id,
    name: persona.name,
    avatarPrompt: parsed.avatarPrompt ?? null,
  };
}

async function course(job: { payload: JobPayload }): Promise<HandlerResult> {
  const nicheId = job.payload.nicheId;
  if (!nicheId) throw new Error("payload.nicheId is required");
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) throw new Error(`Niche ${nicheId} not found`);

  const persona = await prisma.persona.findFirst({ where: { nicheId } });
  const { system, user } = prompts.courseScriptsPrompt(
    niche.name,
    job.payload.topic,
    persona?.masterPrompt || undefined
  );
  const llm = await completeWithFallback({ system, user, json: true });
  const parsed = parseJson<{
    title?: string;
    problemStatement?: string;
    lessons?: { title?: string; script?: string; videoPrompt?: string }[];
  }>(llm.text);

  const lessons = (parsed.lessons ?? [])
    .filter((l) => l.title)
    .slice(0, 10);

  const course = await prisma.course.create({
    data: {
      nicheId,
      title: parsed.title?.trim() || "Untitled course",
      problemStatement: parsed.problemStatement || null,
      status: "READY",
      lessons: {
        create: lessons.map((l, i) => ({
          title: l.title!.trim(),
          script: l.script || null,
          videoPrompt: l.videoPrompt || null,
          order: i,
        })),
      },
    },
    include: { lessons: true },
  });

  return {
    model: llm.model,
    promptTokens: llm.promptTokens,
    completionTokens: llm.completionTokens,
    courseId: course.id,
    title: course.title,
    lessonCount: course.lessons.length,
    withVideoPrompts: course.lessons.filter((l) => l.videoPrompt).length,
  };
}

async function contentPlan(job: { payload: JobPayload }): Promise<HandlerResult> {
  const nicheId = job.payload.nicheId;
  if (!nicheId) throw new Error("payload.nicheId is required");
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) throw new Error(`Niche ${nicheId} not found`);

  const dayCount = Math.min(Math.max(job.payload.dayCount ?? 30, 1), 30);
  const persona = await prisma.persona.findFirst({ where: { nicheId } });

  type PlanItem = {
    day?: number;
    hook?: string;
    script?: string;
    videoPrompt?: string;
    slides?: { heading?: string; body?: string }[];
    cta?: string;
  };

  // Generate in small batches: one call for all 30 days blows past the model's
  // max output tokens and returns a truncated plan (only a few days). 5 days per
  // call keeps every response comfortably under the limit.
  const BATCH = 5;
  const collected: PlanItem[] = [];
  let model = "";
  let promptTokens = 0;
  let completionTokens = 0;

  for (let start = 1; start <= dayCount; start += BATCH) {
    const end = Math.min(start + BATCH - 1, dayCount);
    const { system, user } = prompts.contentPlanPrompt(
      niche.name,
      start,
      end,
      persona?.masterPrompt || undefined
    );
    const llm = await completeWithFallback({ system, user, json: true });
    model = llm.model;
    promptTokens += llm.promptTokens;
    completionTokens += llm.completionTokens;
    const parsed = parseJson<{ items?: PlanItem[] }>(llm.text);
    collected.push(...(parsed.items ?? []));
  }

  const items = collected
    .slice(0, dayCount)
    .sort((a, b) => (a.day ?? 0) - (b.day ?? 0));

  const plan = await prisma.contentPlan.create({
    data: {
      nicheId,
      title: `Content plan — ${niche.name}`,
      dayCount: items.length,
      status: "READY",
      items: {
        create: items.map((it, i) => {
          const slides = (it.slides ?? [])
            .filter((s) => s.heading || s.body)
            .map((s) => ({
              heading: s.heading?.trim() || "",
              body: s.body?.trim() || "",
            }));
          return {
            dayIndex: it.day && it.day >= 1 ? it.day - 1 : i,
            hook: it.hook || null,
            script: it.script || null,
            videoPrompt: it.videoPrompt || null,
            slides: slides.length > 0 ? slides : undefined,
            cta: it.cta?.trim() || null,
          };
        }),
      },
    },
    include: { items: true },
  });

  // Auto-render the carousel slide images. A render failure must not fail the
  // whole job — the plan itself is already valid.
  let slidesRendered = 0;
  try {
    slidesRendered = await renderPlanSlides(plan.id);
  } catch (e) {
    console.error(`[pipeline] slide render failed for plan ${plan.id}:`, e);
  }

  return {
    model,
    promptTokens,
    completionTokens,
    planId: plan.id,
    title: plan.title,
    itemCount: plan.items.length,
    withVideoPrompts: plan.items.filter((it) => it.videoPrompt).length,
    withCarousels: plan.items.filter((it) => it.slides).length,
    slidesRendered,
  };
}

async function ebook(job: { payload: JobPayload }): Promise<HandlerResult> {
  const nicheId = job.payload.nicheId;
  if (!nicheId) throw new Error("payload.nicheId is required");
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) throw new Error(`Niche ${nicheId} not found`);

  // Affiliate niches sell someone else's product — no lead-magnet ebook needed.
  if (niche.monetizationType === "AFFILIATE") {
    return {
      skipped: "affiliate",
      reason: "Affiliate niches do not need a lead-magnet ebook",
    };
  }

  // Ground the ebook in the latest content plan's topics so short-form content
  // funnels readers into the book (consistent product).
  const plan = await prisma.contentPlan.findFirst({
    where: { nicheId },
    orderBy: { createdAt: "desc" },
    include: { items: { orderBy: { dayIndex: "asc" } } },
  });
  const topics = (plan?.items ?? [])
    .map((it) => it.hook)
    .filter((h): h is string => Boolean(h));

  const persona = await prisma.persona.findFirst({ where: { nicheId } });
  const avatarRef = persona?.masterPrompt || undefined;

  // Phase 1 — outline: title, subtitle, chapter titles (one small call).
  const outlinePair = prompts.ebookOutlinePrompt(niche.name, topics, avatarRef);
  const outline = await completeWithFallback({
    system: outlinePair.system,
    user: outlinePair.user,
    json: true,
  });
  const outlineParsed = parseJson<{
    title?: string;
    subtitle?: string;
    chapters?: { title?: string }[];
  }>(outline.text);

  const titles = (outlineParsed.chapters ?? [])
    .map((c) => c.title?.trim())
    .filter((t): t is string => Boolean(t))
    .slice(0, 10);
  if (titles.length === 0) throw new Error("Ebook outline returned no chapters");

  // Phase 2 — chapter content, batched 3 per call (deep chapters blow the token
  // limit if requested in one go, same lesson as the content plan).
  const BATCH = 3;
  const chapters: { title: string; content: string }[] = [];
  let model = outline.model;
  let promptTokens = outline.promptTokens;
  let completionTokens = outline.completionTokens;

  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const cp = prompts.ebookChaptersPrompt(niche.name, batch, avatarRef);
    const llm = await completeWithFallback({ system: cp.system, user: cp.user, json: true });
    model = llm.model;
    promptTokens += llm.promptTokens;
    completionTokens += llm.completionTokens;
    const parsed = parseJson<{ chapters?: { title?: string; content?: string }[] }>(
      llm.text
    );
    for (const c of parsed.chapters ?? []) {
      if (!c.title || !c.content) continue;
      chapters.push({ title: c.title.trim(), content: c.content.trim() });
    }
  }

  const created = await prisma.ebook.create({
    data: {
      nicheId,
      title: outlineParsed.title?.trim() || `Ebook — ${niche.name}`,
      subtitle: outlineParsed.subtitle?.trim() || null,
      chapters: chapters as unknown as Prisma.InputJsonValue,
      status: "READY",
    },
  });

  return {
    model,
    promptTokens,
    completionTokens,
    ebookId: created.id,
    title: created.title,
    chapterCount: chapters.length,
  };
}

export async function runJob(job: {
  id: string;
  type: string;
  payload: JobPayload;
}): Promise<HandlerResult> {
  switch (job.type) {
    case "NICHE_RESEARCH":
      return research(job);
    case "PERSONA_GENERATE":
      return persona(job);
    case "COURSE_SCRIPTS":
      return course(job);
    case "CONTENT_PLAN":
      return contentPlan(job);
    case "EBOOK_GENERATE":
      return ebook(job);
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}
