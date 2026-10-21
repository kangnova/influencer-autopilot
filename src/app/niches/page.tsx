import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NicheForm } from "@/components/niche-form";
import { Nav } from "@/components/nav";
import { DeleteButton } from "@/components/delete-button";
import { RunJobButton } from "@/components/run-job-button";
import { NicheSalesLinkForm } from "@/components/niche-sales-link-form";
import { NicheMonetizationForm } from "@/components/niche-monetization-form";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function NichesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const niches = await prisma.niche.findMany({
    orderBy: { createdAt: "desc" },
    include: { ebooks: { orderBy: { createdAt: "desc" } } },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Niches</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <NicheForm />

      <section className="space-y-3">
        <h2 className="font-medium">Your niches ({niches.length})</h2>
        {niches.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No niches yet. Add your first niche above.
          </p>
        ) : (
          <ul className="space-y-2">
            {niches.map((niche) => (
              <li
                key={niche.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">{niche.name}</p>
                  {niche.description && (
                    <p className="mt-1 text-sm text-neutral-600">{niche.description}</p>
                  )}
                  <p className="mt-2 text-xs text-neutral-400">Status: {niche.status}</p>
                  {niche.researchNotes && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-neutral-500">
                        Research notes
                      </summary>
                      <pre className="mt-1 overflow-x-auto rounded bg-neutral-50 p-2 text-xs text-neutral-700">
                        {niche.researchNotes}
                      </pre>
                    </details>
                  )}
                  <NicheSalesLinkForm
                    id={niche.id}
                    salesLinkUrl={niche.salesLinkUrl}
                  />
                  <NicheMonetizationForm
                    id={niche.id}
                    monetizationType={niche.monetizationType}
                  />
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-neutral-500">
                      Ebooks ({niche.ebooks.length})
                    </summary>
                    <div className="mt-1 space-y-2">
                      {niche.ebooks.length === 0 ? (
                        <p className="text-xs text-neutral-400">
                          Belum ada ebook. Generate dulu.
                        </p>
                      ) : (
                        niche.ebooks.map((ebook) => {
                          const chapters = Array.isArray(ebook.chapters)
                            ? (ebook.chapters as { title?: string; content?: string }[])
                            : [];
                          return (
                            <details key={ebook.id} className="rounded bg-neutral-50 p-2">
                              <summary className="cursor-pointer text-xs font-medium">
                                {ebook.title}
                              </summary>
                              <div className="mt-1 space-y-2">
                                <a
                                  href={`/api/ebooks/${ebook.id}/pdf`}
                                  className="inline-block rounded border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                                >
                                  ⬇ Download PDF
                                </a>
                                {chapters.map((c, i) => (
                                  <div key={i}>
                                    <p className="text-xs font-semibold">
                                      {i + 1}. {c.title}
                                    </p>
                                    <p className="whitespace-pre-wrap text-xs text-neutral-600">
                                      {c.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          );
                        })
                      )}
                    </div>
                  </details>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <RunJobButton
                    type="NICHE_RESEARCH"
                    payload={{ nicheId: niche.id }}
                    label="Run research"
                  />
                  <RunJobButton
                    type="PERSONA_GENERATE"
                    payload={{ nicheId: niche.id }}
                    label="Generate persona"
                  />
                  <RunJobButton
                    type="COURSE_SCRIPTS"
                    payload={{ nicheId: niche.id }}
                    label="Generate course"
                  />
                  <RunJobButton
                    type="CONTENT_PLAN"
                    payload={{ nicheId: niche.id }}
                    label="Generate content plan"
                  />
                  {niche.monetizationType === "OWN_PRODUCT" && (
                    <RunJobButton
                      type="EBOOK_GENERATE"
                      payload={{ nicheId: niche.id }}
                      label="Generate ebook"
                    />
                  )}
                  <DeleteButton id={niche.id} name={niche.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
