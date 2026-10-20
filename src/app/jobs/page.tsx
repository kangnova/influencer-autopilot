import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { LogoutButton } from "@/components/logout-button";
import { JobsList } from "@/components/jobs-list";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <section className="space-y-3">
        <h2 className="font-medium">Pipeline runs (auto-refreshes every 2s)</h2>
        <JobsList />
      </section>
    </main>
  );
}
