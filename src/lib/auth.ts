import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

/**
 * Verify a Google One Tap / auto-sign-in ID token against Google and resolve the
 * matching local user. Returns null on any failure so authorize() rejects the login.
 */
async function authorizeGoogleIdToken(idToken: string) {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    const info = (await res.json()) as {
      error?: string;
      aud?: string;
      email?: string;
      email_verified?: string | boolean;
    };
    if (!res.ok || info.error) return null;
    if (info.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    if (info.email_verified !== true && info.email_verified !== "true") return null;
    if (!info.email) return null;

    const email = info.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    await prisma.user.update({
      where: { id: user.id },
      data: { googleLinked: true },
    });
    return { id: user.id, email: user.email, role: user.role };
  } catch {
    return null;
  }
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      googleIdToken: { label: "Google ID Token", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials) return null;

      // Google One Tap / auto-sign-in: verify the ID token, no password needed.
      if (credentials.googleIdToken) {
        return authorizeGoogleIdToken(credentials.googleIdToken);
      }

      if (!credentials.email || !credentials.password) return null;
      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() },
      });
      if (!user) return null;
      const valid = await bcrypt.compare(credentials.password, user.password);
      if (!valid) return null;
      return { id: user.id, email: user.email, role: user.role };
    },
  }),
];

if (googleConfigured) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) return "/login?error=EmailNotRegistered";
        // Mark the account as Google-linked so the UI can detect it.
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { googleLinked: true },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google") {
          // OAuth user has no DB id — resolve by email so session.id matches ours.
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email?.toLowerCase() ?? "" },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
          }
        } else {
          token.id = user.id;
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
