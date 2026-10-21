import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import fs from "node:fs";

const TOKEN_FILE = "/home/ubuntu/influencer-autopilot/docs/ID-Aplikasi -admin.txt";

function readToken(): string {
  const raw = fs.readFileSync(TOKEN_FILE, "utf8");
  const m = raw.match(/"access_token":\s*"([^"]+)"/);
  if (m) return m[1];
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.startsWith("EAA"));
  return lines[lines.length - 1] || "";
}

function keyBuffer(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const decoded = Buffer.from(raw, "base64");
  return decoded.length === 32
    ? decoded
    : crypto.createHash("sha256").update(raw).digest();
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${enc.toString("base64")}.${tag.toString("base64")}`;
}

function decrypt(payload: string): string {
  const [ivB64, encB64, tagB64] = payload.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    keyBuffer(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

const GRAPH = `https://graph.facebook.com/${
  process.env.INSTAGRAM_GRAPH_VERSION ?? "v21.0"
}`;

async function graph(path: string, accessToken: string): Promise<any> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `${GRAPH}${path}${sep}access_token=${encodeURIComponent(accessToken)}`
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Graph API ${path} failed (${res.status}): ${body.slice(0, 300)}`
    );
  }
  return res.json();
}

async function resolveHandle(accessToken: string): Promise<string> {
  // Mirip resolveIgUserId di app: pakai INSTAGRAM_PAGE_ID kalau ada,
  // fallback ke /me/accounts by name.
  let pageId = process.env.INSTAGRAM_PAGE_ID?.trim() || undefined;
  if (!pageId) {
    const accounts = await graph("/me/accounts?fields=id,name&limit=100", accessToken);
    const targetName = process.env.INSTAGRAM_PAGE_NAME?.trim().toLowerCase();
    const page =
      (targetName &&
        accounts.data?.find(
          (p: any) => p.name?.trim().toLowerCase() === targetName
        )) ||
      accounts.data?.[0];
    pageId = page?.id;
  }
  if (!pageId) {
    throw new Error(
      `No Facebook Page named "${process.env.INSTAGRAM_PAGE_NAME}" found.`
    );
  }
  const sel = await graph(`/${pageId}?fields=instagram_business_account`, accessToken);
  const igId = sel.instagram_business_account?.id;
  if (!igId) throw new Error("Page has no linked Instagram Business account.");
  const user = await graph(`/${igId}?fields=username`, accessToken);
  if (!user.username) throw new Error("Instagram account did not return a username.");
  return user.username;
}

async function main() {
  const accessToken = readToken();
  if (!accessToken) throw new Error("Token tidak ketemu di file ID-Aplikasi.");
  console.log(`Token dibaca (panjang ${accessToken.length}).`);

  const handle = await resolveHandle(accessToken);
  console.log(`Handle terverifikasi dari API: ${handle}`);

  const prisma = new PrismaClient();
  const encrypted = encrypt(accessToken);
  if (decrypt(encrypted) !== accessToken) {
    throw new Error("Roundtrip encrypt/decrypt gagal!");
  }

  const existing = await prisma.socialAccount.findFirst({ where: { handle } });
  const account = existing
    ? await prisma.socialAccount.update({
        where: { id: existing.id },
        data: { accessToken: encrypted, accountType: "BUSINESS", status: "READY" },
      })
    : await prisma.socialAccount.create({
        data: {
          handle,
          accountType: "BUSINESS",
          accessToken: encrypted,
          status: "READY",
        },
      });

  console.log(
    `SocialAccount tersimpan: id=${account.id}, handle=${account.handle}, status=${account.status}`
  );

  const check = await prisma.socialAccount.findUnique({ where: { id: account.id } });
  const ok = check && decrypt(check.accessToken) === accessToken;
  console.log(`Verifikasi read-back: ${ok ? "OK (token cocok)" : "GAGAL"}`);

  await prisma.$disconnect();
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("ERROR:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
