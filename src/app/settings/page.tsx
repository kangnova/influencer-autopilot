import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { LogoutButton } from "@/components/logout-button";
import { ChangeEmailForm } from "@/components/change-email-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { AddUserForm } from "@/components/add-user-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user?.id ?? "" },
  });
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-neutral-500">{session.user?.email}</p>
        </div>
        <LogoutButton />
      </header>

      <Nav />

      <section className="space-y-3">
        <h2 className="font-medium">Account</h2>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Signed in as</span>
            <span className="font-medium">{me?.email}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-neutral-600">Google account</span>
            {me?.googleLinked ? (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                ✓ Linked
              </span>
            ) : (
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                Not linked
              </span>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ChangeEmailForm currentEmail={me?.email ?? ""} />
          <ChangePasswordForm />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Users ({users.length})</h2>
        <ul className="space-y-2">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.email}</p>
                <p className="text-xs text-neutral-400">{u.role}</p>
              </div>
              {u.googleLinked && (
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Google linked
                </span>
              )}
            </li>
          ))}
        </ul>
        <AddUserForm />
      </section>
    </main>
  );
}
