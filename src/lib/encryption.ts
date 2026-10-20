import crypto from "node:crypto";

/**
 * Symmetric encryption for secrets at rest (Instagram access tokens).
 *
 * AES-256-GCM with a random 96-bit IV per encryption. The key is derived from
 * ENCRYPTION_KEY: a base64 32-byte value is used as-is, anything else is hashed
 * with SHA-256 to a 32-byte key. Payload format (dot-separated base64):
 *   iv.ciphertext.authTag
 */

function keyBuffer(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const decoded = Buffer.from(raw, "base64");
  return decoded.length === 32
    ? decoded
    : crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${enc.toString("base64")}.${tag.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [ivB64, encB64, tagB64] = payload.split(".");
  if (!ivB64 || !encB64 || !tagB64) {
    throw new Error("Malformed encrypted payload");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    keyBuffer(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const out = Buffer.concat([
    decipher.update(Buffer.from(encB64, "base64")),
    decipher.final(),
  ]);
  return out.toString("utf8");
}
