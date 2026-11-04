// API response policy: costs are restricted to stock/finance management roles.
export const SALES_READ_ROLES = ["ADMIN", "MANAGER", "CASHIER", "ACCOUNTANT"] as const;
const COST_ROLES: readonly string[] = ["ADMIN", "MANAGER", "ACCOUNTANT", "INVENTORY"];
const COST_FIELDS = new Set(["costPrice", "totalCost", "grossProfit", "averageCost", "inventoryValue"]);

export function redactCosts(value: unknown, role: string): unknown {
  // Serialize first so Prisma Decimal/Date values retain their normal JSON form.
  return JSON.parse(JSON.stringify(value, (key, item) =>
    !COST_ROLES.includes(role) && COST_FIELDS.has(key) ? undefined : item
  ));
}

export function validUploadUrl(value: unknown): value is string {
  // A single generated filename, never a path, drive, encoded path or ADS.
  return typeof value === "string" && /^\/uploads\/products\/[a-z0-9][a-z0-9-]{0,180}\.(?:png|jpg|webp)$/.test(value);
}

export function validImageContent(bytes: Uint8Array, mime: string): boolean {
  if (mime === "image/png") return bytes.length >= 24 &&
    [137,80,78,71,13,10,26,10].every((v, i) => bytes[i] === v) &&
    String.fromCharCode(...bytes.subarray(12,16)) === "IHDR";
  if (mime === "image/jpeg" || mime === "image/jpg") return bytes.length >= 4 &&
    bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 &&
    bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217;
  if (mime === "image/webp") return bytes.length >= 16 &&
    String.fromCharCode(...bytes.subarray(0,4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8,12)) === "WEBP" &&
    ["VP8 ", "VP8L", "VP8X"].includes(String.fromCharCode(...bytes.subarray(12,16)));
  return false;
}
