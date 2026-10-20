import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { MediaUploadForm } from "@/components/media-upload-form";
import { DeleteButton } from "@/components/delete-button";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Media library</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <MediaUploadForm />

      <section className="space-y-3">
        <h2 className="font-medium">Assets ({assets.length})</h2>
        {assets.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No media yet. Upload your first image or video above.
          </p>
        ) : (
          <ul className="space-y-2">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {asset.kind === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.url}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <video
                      src={asset.url}
                      className="h-16 w-16 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{asset.url}</p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {asset.kind} · {asset.source} · {asset.status}
                    </p>
                  </div>
                </div>
                <DeleteButton
                  id={asset.id}
                  name={asset.url}
                  endpoint="/api/media"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
