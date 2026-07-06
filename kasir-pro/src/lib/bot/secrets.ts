import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const IV_LENGTH = 12;

function getEncryptionKey() {
  const secret =
    process.env.BOT_CREDENTIALS_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    "";

  if (!secret) {
    throw new Error(
      "BOT_CREDENTIALS_SECRET atau BETTER_AUTH_SECRET wajib tersedia untuk menyimpan kredensial bot"
    );
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptBotSecret(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalized, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptBotSecret(value?: string | null) {
  if (!value) {
    return null;
  }

  const [ivBase64, authTagBase64, payloadBase64] = value.split(".");
  if (!ivBase64 || !authTagBase64 || !payloadBase64) {
    throw new Error("Format secret bot tidak valid");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(ivBase64, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payloadBase64, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
