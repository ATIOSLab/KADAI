import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL must be configured"),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET must be at least 16 characters").default("default-development-secret-change-in-prod-32bytes"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("KADAI"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-5.5"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    APP_BASE_URL: process.env.APP_BASE_URL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  });

  if (!result.success) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ CRITICAL: Invalid environment configuration:", result.error.format());
      throw new Error("Invalid environment configuration. Check logs for details.");
    }
    // Return partial fallback in development
    return {
      NODE_ENV: "development",
      PORT: "3000",
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/kadai",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "dev-secret-at-least-32-characters-long-12345",
      BETTER_AUTH_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_NAME: "KADAI",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      APP_BASE_URL: "http://localhost:3000",
      TELEGRAM_BOT_TOKEN: "",
      TELEGRAM_WEBHOOK_SECRET: "",
      OPENAI_API_KEY: "",
      OPENAI_MODEL: "gpt-5.5",
    };
  }

  return result.data;
}

export const env = parseEnv();
