import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 50 * 1024 * 1024; // 50MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

function extFor(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return map[mime] ?? "bin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });
  return ok(assets);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail("Unauthorized", 401);

  const form = await req.formData().catch(() => null);
  if (!form) return fail("Invalid form data", 422);

  const file = form.get("file");
  if (!file || typeof file === "string") return fail("File is required", 422);
  const f = file as File;

  if (f.size === 0) return fail("File is empty", 422);
  if (f.size > MAX_BYTES) return fail("File too large (max 50MB)", 413);

  const kind = f.type.startsWith("video/")
    ? "VIDEO"
    : f.type.startsWith("image/")
      ? "IMAGE"
      : null;
  if (!kind) return fail("Only image or video files are allowed", 422);

  const lessonId = form.get("lessonId");
  const contentItemId = form.get("contentItemId");
  const targetLessonId =
    typeof lessonId === "string" && lessonId.trim() ? lessonId.trim() : null;
  const targetItemId =
    typeof contentItemId === "string" && contentItemId.trim()
      ? contentItemId.trim()
      : null;
  if (targetLessonId && targetItemId) {
    return fail("Provide lessonId or contentItemId, not both", 422);
  }

  // Validate the link target BEFORE writing the file so a bad target never
  // leaves an orphaned asset on disk.
  if (targetLessonId) {
    const lesson = await prisma.lesson.findUnique({ where: { id: targetLessonId } });
    if (!lesson) return fail("Lesson not found", 404);
    if (lesson.mediaAssetId) return fail("Lesson already has media attached", 409);
  }
  if (targetItemId) {
    const item = await prisma.contentItem.findUnique({ where: { id: targetItemId } });
    if (!item) return fail("Content item not found", 404);
    if (item.mediaAssetId) return fail("Content item already has media attached", 409);
  }

  const bytes = Buffer.from(await f.arrayBuffer());
  const filename = `${randomUUID()}.${extFor(f.type)}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);

  const asset = await prisma.mediaAsset.create({
    data: {
      url: `/uploads/${filename}`,
      kind,
      source: "MANUAL",
      status: "READY",
    },
  });

  if (targetLessonId) {
    await prisma.lesson.update({
      where: { id: targetLessonId },
      data: { mediaAssetId: asset.id, status: "READY" },
    });
  }
  if (targetItemId) {
    await prisma.contentItem.update({
      where: { id: targetItemId },
      data: { mediaAssetId: asset.id, status: "READY" },
    });
  }

  return ok(asset, 201);
}
