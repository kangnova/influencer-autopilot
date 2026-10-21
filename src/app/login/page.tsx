import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/niches");

  const { error } = await searchParams;
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const googleEnabled = Boolean(
    googleClientId && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <LoginForm
        googleEnabled={googleEnabled}
        googleClientId={googleClientId}
        initialError={error}
      />
    </main>
  );
}
