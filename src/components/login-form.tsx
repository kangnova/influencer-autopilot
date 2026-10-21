"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function initialErrorMessage(error?: string): string {
  if (!error) return "";
  if (error === "EmailNotRegistered")
    return "This email is not registered yet. Ask the admin to add your account first.";
  if (error === "OAuthAccountNotLinked")
    return "This email is already linked to a different sign-in method.";
  return "Sign in failed. Please try again.";
}

const NOT_REGISTERED =
  "This email is not registered yet. Ask the admin to add your account first.";

type GoogleCredentialResponse = { credential?: string };
type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (cfg: {
        client_id: string;
        callback: (resp: GoogleCredentialResponse) => void;
      }) => void;
      prompt: () => void;
    };
  };
};

function loadGoogleIdentity(): Promise<GoogleIdentity | null> {
  return new Promise((resolve) => {
    const win = window as unknown as { google?: GoogleIdentity };
    if (win.google?.accounts?.id) {
      resolve(win.google);
      return;
    }
    const existing = document.getElementById("gsi-client");
    if (existing) {
      // Script already loading — wait for it once.
      existing.addEventListener("load", () => resolve(win.google ?? null), {
        once: true,
      });
      return;
    }
    const s = document.createElement("script");
    s.id = "gsi-client";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(win.google ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export function LoginForm({
  googleEnabled,
  googleClientId,
  initialError,
}: {
  googleEnabled: boolean;
  googleClientId: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialErrorMessage(initialError));
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setGoogleLoading(true);
      setError("");
      const res = await signIn("credentials", {
        googleIdToken: credential,
        redirect: false,
      });
      if (res?.error) {
        setError(NOT_REGISTERED);
        setGoogleLoading(false);
        return;
      }
      router.push("/niches");
      router.refresh();
    },
    [router],
  );

  // Google One Tap: auto-detect an active Google session and prompt "Continue as".
  useEffect(() => {
    if (!googleEnabled || !googleClientId) return;
    let cancelled = false;
    loadGoogleIdentity().then((g) => {
      if (cancelled || !g) return;
      g.accounts.id.initialize({
        client_id: googleClientId,
        callback: (resp) => {
          if (resp?.credential) handleGoogleCredential(resp.credential);
        },
      });
      g.accounts.id.prompt();
    });
    return () => {
      cancelled = true;
    };
  }, [googleEnabled, googleClientId, handleGoogleCredential]);

  // Auto-detect whether the typed email is linked to a Google account.
  function handleEmailChange(value: string) {
    setEmail(value);
    if (!googleEnabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setGoogleLinked(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(
        `/api/auth/google-status?email=${encodeURIComponent(trimmed)}`,
      );
      const json = await res.json().catch(() => null);
      if (json?.ok) setGoogleLinked(Boolean(json.data?.googleLinked));
    }, 400);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }
    router.push("/niches");
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    await signIn("google", { callbackUrl: "/niches" });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
      {error && (
        <p className="mb-4 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
      )}

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className={`mb-4 flex w-full items-center justify-center gap-2 rounded border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
              googleLinked
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>
          <div className="mb-4 flex items-center gap-3 text-xs text-neutral-400">
            <span className="h-px flex-1 bg-neutral-200" />
            or
            <span className="h-px flex-1 bg-neutral-200" />
          </div>
        </>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          {googleLinked && (
            <p className="mt-1 text-xs text-emerald-600">
              This email is linked to Google — use “Continue with Google”.
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-neutral-900 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
