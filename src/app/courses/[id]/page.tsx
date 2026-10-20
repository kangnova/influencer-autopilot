import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { LogoutButton } from "@/components/logout-button";
import { AttachMediaForm } from "@/components/attach-media-form";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      niche: true,
      lessons: {
        orderBy: { order: "asc" },
        include: { mediaAsset: true },
      },
    },
  });
  if (!course) notFound();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/courses" className="text-sm text-neutral-500 hover:underline">
            ← Courses
          </Link>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-neutral-500">{course.niche?.name}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      {course.problemStatement && (
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
          {course.problemStatement}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-medium">Lessons ({course.lessons.length})</h2>
        {course.lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="rounded-lg border border-neutral-200 bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">
                {lesson.order + 1}. {lesson.title}
              </p>
              <span className="text-xs text-neutral-400">{lesson.status}</span>
            </div>

            {lesson.script && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-neutral-500">
                  Script
                </summary>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-50 p-2 text-xs text-neutral-700">
                  {lesson.script}
                </pre>
              </details>
            )}

            {lesson.videoPrompt && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-neutral-500">
                  Video prompt
                </summary>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-neutral-50 p-2 text-xs text-neutral-700">
                  {lesson.videoPrompt}
                </pre>
              </details>
            )}

            <div className="mt-3">
              {lesson.mediaAsset ? (
                <div className="flex items-center gap-3">
                  {lesson.mediaAsset.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lesson.mediaAsset.url}
                      alt={lesson.mediaAsset.url}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <video
                      src={lesson.mediaAsset.url}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {lesson.mediaAsset.url}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {lesson.mediaAsset.kind} · {lesson.mediaAsset.source}
                    </p>
                  </div>
                </div>
              ) : (
                <AttachMediaForm target={{ lessonId: lesson.id }} label="Attach video" />
              )}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
