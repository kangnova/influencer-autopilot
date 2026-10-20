import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { SocialAccountForm } from "@/components/social-account-form";
import { DeleteButton } from "@/components/delete-button";
import { LogoutButton } from "@/components/logout-button";
import { getSocialProvider } from "@/lib/social-provider";

export const dynamic = "force-dynamic";

export default async function SocialAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const provider = getSocialProvider();
  const accounts = await prisma.socialAccount.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social accounts</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      {provider.name === "manual" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Manual mode: you will post to Instagram yourself, then mark each post
          &quot;published manually&quot;. No API calls, no account risk.
        </p>
      )}

      <SocialAccountForm requiresToken={provider.name !== "manual"} />

      <section className="space-y-3">
        <h2 className="font-medium">Accounts ({accounts.length})</h2>
        {accounts.length === 0 ? (
          <p className="rounded border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No accounts yet. Connect Instagram above.
          </p>
        ) : (
          <ul className="space-y-2">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium">@{account.handle}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {account.platform} · {account.accountType} · {account.status}
                  </p>
                </div>
                <DeleteButton
                  id={account.id}
                  name={`@${account.handle}`}
                  endpoint="/api/social-accounts"
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
