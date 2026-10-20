import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { niche: true, lessons: { orderBy: { order: "asc" } } },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Courses</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <section className="space-y-3">
        <h2 className="font-medium">Your courses ({courses.length})</h2>
        {courses.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No courses yet. Generate one from a niche on the Niches page.
          </p>
        ) : (
          <ul className="space-y-2">
            {courses.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <Link href={`/courses/${c.id}`} className="font-medium hover:underline">
                  {c.title}
                </Link>
                <p className="mt-1 text-xs text-neutral-400">
                  {c.niche?.name ?? "—"} · {c.lessons.length} lessons · {c.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
