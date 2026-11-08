import crypto from "node:crypto";
import type { PaymentProvider } from "@prisma/client";

/**
 * ADAPTER PEMBAYARAN KADAI
 * MANUAL  : transfer bank (default Indonesia) — instruksi ditampilkan, admin verifikasi bukti.
 * MIDTRANS: Snap API (sandbox/production) — dipakai bila MIDTRANS_SERVER_KEY tersedia.
 * XENDIT  : Invoice API — dipakai bila XENDIT_SECRET_KEY tersedia.
 * Adapter tanpa kredensial menolak dengan pesan jelas (tidak pernah menandai lunas tanpa bukti).
 */

export interface PaymentIntent {
  providerRef: string;
  checkoutUrl?: string;
  instructions?: string[];
}

export interface CreatePaymentArgs {
  amount: number;
  description: string;
  externalId: string;
  customerName: string;
  customerEmail?: string | null;
}

function basicAuth(secret: string): string {
  return `Basic ${Buffer.from(`${secret}:`).toString("base64")}`;
}

export function bankInstructions(): string[] {
  return [
    `Transfer ke rekening ${process.env.KADAI_BANK_NAME || "Bank (belum dikonfigurasi)"}`,
    `Nomor rekening: ${process.env.KADAI_BANK_ACCOUNT || "—"}`,
    `Atas nama: ${process.env.KADAI_BANK_HOLDER || "NEW ASIA TECH"}`,
    "Setelah transfer, kirim bukti transfer ke tim KADAI untuk verifikasi dan aktivasi.",
  ];
}

async function createMidtransPayment(args: CreatePaymentArgs): Promise<PaymentIntent> {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum dikonfigurasi pada environment");
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const base = isProduction
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";

  const response = await fetch(`${base}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: basicAuth(key),
    },
    body: JSON.stringify({
      transaction_details: { order_id: args.externalId, gross_amount: args.amount },
      item_details: [
        {
          id: args.externalId,
          price: args.amount,
          quantity: 1,
          name: args.description.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: args.customerName.slice(0, 50),
        email: args.customerEmail || undefined,
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as {
    token?: string;
    redirect_url?: string;
    error_messages?: string[];
  };
  if (!response.ok || !data.token) {
    throw new Error(`Midtrans gagal membuat transaksi: ${data.error_messages?.join("; ") || response.status}`);
  }
  return { providerRef: data.token, checkoutUrl: data.redirect_url };
}

async function createXenditPayment(args: CreatePaymentArgs): Promise<PaymentIntent> {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error("XENDIT_SECRET_KEY belum dikonfigurasi pada environment");

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: basicAuth(key),
    },
    body: JSON.stringify({
      external_id: args.externalId,
      amount: args.amount,
      description: args.description.slice(0, 250),
      payer_email: args.customerEmail || undefined,
      customer: { given_names: args.customerName.slice(0, 100) },
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as { id?: string; invoice_url?: string; message?: string };
  if (!response.ok || !data.id) {
    throw new Error(`Xendit gagal membuat invoice: ${data.message || response.status}`);
  }
  return { providerRef: data.id, checkoutUrl: data.invoice_url };
}

export async function createPaymentIntent(
  provider: PaymentProvider,
  args: CreatePaymentArgs
): Promise<PaymentIntent> {
  switch (provider) {
    case "MIDTRANS":
      return createMidtransPayment(args);
    case "XENDIT":
      return createXenditPayment(args);
    default:
      return { providerRef: "", instructions: bankInstructions() };
  }
}

/** Verifikasi signature webhook Midtrans: sha512(order_id + status_code + gross_amount + server_key). */
export function verifyMidtransSignature(body: {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
}): boolean {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key || !body.order_id || !body.status_code || !body.gross_amount || !body.signature_key) {
    return false;
  }
  const expected = crypto
    .createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${key}`)
    .digest("hex");
  const received = body.signature_key;
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

/** Verifikasi callback token Xendit. */
export function verifyXenditCallbackToken(receivedToken: string | null): boolean {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  if (!expected || !receivedToken) return false;
  if (expected.length !== receivedToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedToken));
}

export function midtransIsSettled(transactionStatus: string, fraudStatus?: string): boolean {
  if (transactionStatus === "settlement") return true;
  return transactionStatus === "capture" && fraudStatus === "accept";
}
