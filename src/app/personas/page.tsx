import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { PersonaForm } from "@/components/persona-form";
import { DeleteButton } from "@/components/delete-button";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function PersonasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [personas, niches] = await Promise.all([
    prisma.persona.findMany({
      orderBy: { createdAt: "desc" },
      include: { niche: { select: { id: true, name: true } } },
    }),
    prisma.niche.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personas</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <PersonaForm niches={niches} />

      <section className="space-y-3">
        <h2 className="font-medium">Your personas ({personas.length})</h2>
        {personas.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No personas yet. Add your first persona above.
          </p>
        ) : (
          <ul className="space-y-2">
            {personas.map((persona) => (
              <li
                key={persona.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{persona.name}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Niche: {persona.niche.name}
                  </p>
                  {persona.identity && (
                    <p className="mt-1 text-sm text-neutral-600">
                      {persona.identity}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-neutral-400">
                    Status: {persona.status}
                  </p>
                </div>
                <DeleteButton
                  id={persona.id}
                  name={persona.name}
                  endpoint="/api/personas"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
