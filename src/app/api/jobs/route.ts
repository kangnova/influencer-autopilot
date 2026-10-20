import { JobStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";

const VALID_STATUSES: JobStatus[] = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED"];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const status = new URL(req.url).searchParams.get("status");
  if (status && !VALID_STATUSES.includes(status as JobStatus)) {
    return fail("Invalid status filter", 422);
  }

  const jobs = await prisma.job.findMany({
    where: status ? { status: status as JobStatus } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return ok(jobs);
}
