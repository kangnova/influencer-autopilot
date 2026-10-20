import { prisma } from "./prisma";
import { completeWithFallback } from "./openrouter";
import * as prompts from "./prompts";

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

  const { system, user } = prompts.courseScriptsPrompt(
    niche.name,
    job.payload.topic
  );
  const llm = await completeWithFallback({ system, user, json: true });
  const parsed = parseJson<{
    title?: string;
    problemStatement?: string;
    lessons?: { title?: string; script?: string }[];
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
  };
}

async function contentPlan(job: { payload: JobPayload }): Promise<HandlerResult> {
  const nicheId = job.payload.nicheId;
  if (!nicheId) throw new Error("payload.nicheId is required");
  const niche = await prisma.niche.findUnique({ where: { id: nicheId } });
  if (!niche) throw new Error(`Niche ${nicheId} not found`);

  const dayCount = Math.min(Math.max(job.payload.dayCount ?? 30, 1), 30);

  const { system, user } = prompts.contentPlanPrompt(niche.name, dayCount);
  const llm = await completeWithFallback({ system, user, json: true });
  const parsed = parseJson<{
    title?: string;
    items?: { day?: number; hook?: string; script?: string }[];
  }>(llm.text);

  const items = (parsed.items ?? []).slice(0, dayCount);

  const plan = await prisma.contentPlan.create({
    data: {
      nicheId,
      title: parsed.title?.trim() || `Content plan — ${niche.name}`,
      dayCount: items.length,
      status: "READY",
      items: {
        create: items.map((it) => ({
          dayIndex: it.day ?? 0,
          hook: it.hook || null,
          script: it.script || null,
        })),
      },
    },
    include: { items: true },
  });

  return {
    model: llm.model,
    promptTokens: llm.promptTokens,
    completionTokens: llm.completionTokens,
    planId: plan.id,
    title: plan.title,
    itemCount: plan.items.length,
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
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}
