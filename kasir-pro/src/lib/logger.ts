type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: unknown;
}

const REDACTED_KEYS = new Set([
  "password",
  "pin",
  "token",
  "secret",
  "cookie",
  "authorization",
  "creditcard",
  "cvv",
]);

function sanitizeLogData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogData);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function formatError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    };
  }
  return { message: String(err) };
}

class EnterpriseLogger {
  private isProd = process.env.NODE_ENV === "production";

  private log(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    const entry: Record<string, unknown> = {
      timestamp,
      level,
      context: payload.context || "System",
      message: payload.message,
    };

    if (payload.data) {
      entry.data = sanitizeLogData(payload.data);
    }

    if (payload.error) {
      entry.error = formatError(payload.error);
    }

    const output = this.isProd ? JSON.stringify(entry) : `[${timestamp}] [${level.toUpperCase()}] [${entry.context}]: ${entry.message}`;

    if (level === "error") {
      console.error(output);
      if (!this.isProd && payload.error) console.error(payload.error);
    } else if (level === "warn") {
      console.warn(output);
    } else if (level === "debug") {
      if (!this.isProd) console.debug(output);
    } else {
      console.log(output);
    }
  }

  info(message: string, context?: string, data?: Record<string, unknown>) {
    this.log("info", { message, context, data });
  }

  warn(message: string, context?: string, data?: Record<string, unknown>) {
    this.log("warn", { message, context, data });
  }

  error(message: string, error?: unknown, context?: string, data?: Record<string, unknown>) {
    this.log("error", { message, context, error, data });
  }

  debug(message: string, context?: string, data?: Record<string, unknown>) {
    this.log("debug", { message, context, data });
  }
}

export const logger = new EnterpriseLogger();
