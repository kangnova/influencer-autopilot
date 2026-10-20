import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { runJob } from "../src/lib/pipeline";

// tsx does not auto-load .env. Prisma loads DATABASE_URL itself, but the LLM
// client also needs OPENROUTER_API_KEY. Node >= 20.12 provides loadEnvFile.
try {
  process.loadEnvFile(".env");
} catch {
  // .env missing or loadEnvFile unavailable — fall back to the shell env.
}

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 2000);

interface ClaimedJob {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

/**
 * Atomically claims one PENDING job (Postgres FOR UPDATE SKIP LOCKED).
 * Returns null when the queue is empty.
 */
async function claimOne(): Promise<ClaimedJob | null> {
  const rows = await prisma.$queryRaw<ClaimedJob[]>`
    UPDATE "Job"
    SET status = 'RUNNING', "startedAt" = now(), attempts = attempts + 1
    WHERE id = (
      SELECT id FROM "Job"
      WHERE status = 'PENDING'
      ORDER BY "createdAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, type, payload
  `;
  return rows[0] ?? null;
}

async function tick(): Promise<boolean> {
  const job = await claimOne();
  if (!job) return false;

  try {
    const result = await runJob(job);
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "SUCCEEDED",
        result: result as unknown as Prisma.InputJsonValue,
        doneAt: new Date(),
      },
    });
    console.log(`[worker] ${job.id} (${job.type}) SUCCEEDED`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "FAILED", error: msg, doneAt: new Date() },
    });
    console.error(`[worker] ${job.id} (${job.type}) FAILED: ${msg}`);
  }
  return true;
}

async function main() {
  console.log(`[worker] polling every ${POLL_MS}ms`);
  for (;;) {
    let didWork = false;
    try {
      didWork = await tick();
    } catch (e) {
      console.error("[worker] tick error:", e);
    }
    if (!didWork) await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main();
