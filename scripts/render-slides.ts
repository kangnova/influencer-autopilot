import { prisma } from "../src/lib/prisma";
import { renderPlanSlides } from "../src/lib/slide-render";

// tsx does not auto-load .env; Prisma loads DATABASE_URL itself.
try {
  process.loadEnvFile(".env");
} catch {
  // fall back to shell env
}

/**
 * Manual re-run: render carousel slide images for the newest plan (or a given
 * plan id). The pipeline already renders automatically after a CONTENT_PLAN job;
 * use this to regenerate images after editing slide text.
 */
async function main() {
  const planIdArg = process.argv[2];
  const plan = planIdArg
    ? await prisma.contentPlan.findUnique({ where: { id: planIdArg } })
    : await prisma.contentPlan.findFirst({ orderBy: { createdAt: "desc" } });
  if (!plan) {
    console.error("No content plan found.");
    process.exit(1);
  }

  const count = await renderPlanSlides(plan.id);
  console.log(
    `DONE: ${count} slide images -> public/uploads/slides/${plan.id}`
  );
  console.log(
    "Restart the app (pm2 restart influencer-autopilot) to serve newly generated files."
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
