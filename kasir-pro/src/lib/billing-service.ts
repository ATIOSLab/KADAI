import { prisma } from "@/lib/prisma";
import { CYCLE_MONTHS, TIER_LABELS, cyclePrice } from "@/lib/pricing";
import { attributeInvoiceToReferral } from "@/lib/referral-engine";
import type { BillingCycle, PaymentProvider, SubscriptionTier } from "@prisma/client";

/**
 * BILLING SERVICE KADAI
 * - createInvoice  : terbitkan tagihan resmi (nomor INV-YYYYMM-####)
 * - settleInvoice  : tandai lunas -> aktifkan langganan + atribusi komisi mitra
 * - renewDueSubscriptions : terbitkan tagihan perpanjangan otomatis (cron)
 */

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);
  return next;
}

export async function createInvoice(opts: {
  storeId: string;
  tier: SubscriptionTier;
  cycle: BillingCycle;
  description?: string;
  amount?: number;
  provider?: PaymentProvider;
  subscriptionId?: string | null;
}) {
  const store = await prisma.store.findUnique({
    where: { id: opts.storeId },
    select: { id: true, name: true },
  });
  if (!store) throw new Error("Toko tidak ditemukan");

  const amount = opts.amount ?? cyclePrice(opts.tier, opts.cycle);

  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const issued = await prisma.paymentInvoice.count({
    where: { invoiceNumber: { startsWith: `INV-${stamp}` } },
  });
  const invoiceNumber = `INV-${stamp}-${String(issued + 1).padStart(4, "0")}`;

  return prisma.paymentInvoice.create({
    data: {
      storeId: store.id,
      subscriptionId: opts.subscriptionId ?? null,
      invoiceNumber,
      description:
        opts.description ??
        `Langganan ${TIER_LABELS[opts.tier]} ${opts.cycle.toLowerCase()} — ${store.name}`,
      tier: opts.tier,
      cycle: opts.cycle,
      amount,
      provider: opts.provider ?? "MANUAL",
      status: "PENDING",
    },
  });
}

export async function settleInvoice(opts: {
  invoiceId: string;
  paidBy: string;
  paymentProof?: string | null;
  notes?: string | null;
  providerRef?: string | null;
}) {
  const invoice = await prisma.paymentInvoice.findUnique({
    where: { id: opts.invoiceId },
    include: { store: { select: { id: true, phone: true, name: true } } },
  });
  if (!invoice) throw new Error("Invoice tidak ditemukan");
  if (invoice.status === "SETTLED") {
    return { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, alreadySettled: true };
  }

  const result = await prisma.$transaction(async (tx) => {
    const settled = await tx.paymentInvoice.update({
      where: { id: invoice.id },
      data: {
        status: "SETTLED",
        paidAt: new Date(),
        paidBy: opts.paidBy,
        paymentProof: opts.paymentProof ?? invoice.paymentProof,
        notes: opts.notes ?? invoice.notes,
        providerRef: opts.providerRef ?? invoice.providerRef,
      },
    });

    const now = new Date();
    const existing = await tx.storeSubscription.findFirst({
      where: { storeId: invoice.storeId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    let subscriptionId: string;
    if (existing) {
      const base =
        existing.expiresAt && existing.expiresAt.getTime() > now.getTime() ? existing.expiresAt : now;
      const extended = await tx.storeSubscription.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          tier: invoice.tier,
          cycle: invoice.cycle,
          expiresAt: addMonths(base, CYCLE_MONTHS[invoice.cycle]),
        },
      });
      subscriptionId = extended.id;
    } else {
      const created = await tx.storeSubscription.create({
        data: {
          storeId: invoice.storeId,
          tier: invoice.tier,
          cycle: invoice.cycle,
          status: "ACTIVE",
          startedAt: now,
          expiresAt: addMonths(now, CYCLE_MONTHS[invoice.cycle]),
        },
      });
      subscriptionId = created.id;
    }

    await tx.paymentInvoice.update({
      where: { id: invoice.id },
      data: { subscriptionId },
    });
    await tx.store.update({
      where: { id: invoice.storeId },
      data: { tier: invoice.tier },
    });

    // Atribusi komisi mitra referral (idempotent)
    await attributeInvoiceToReferral(tx, {
      invoiceId: invoice.id,
      amount: invoice.amount,
      storeId: invoice.storeId,
      storePhone: invoice.store.phone,
    });

    return { invoiceId: settled.id, invoiceNumber: settled.invoiceNumber, subscriptionId };
  });

  return { ...result, alreadySettled: false };
}

/** Terbitkan tagihan perpanjangan untuk langganan yang jatuh tempo <= 3 hari. */
export async function renewDueSubscriptions(): Promise<string[]> {
  const now = new Date();
  const grace = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const due = await prisma.storeSubscription.findMany({
    where: { status: "ACTIVE", expiresAt: { lte: grace } },
    include: { invoices: { where: { status: "PENDING" }, select: { id: true } } },
  });

  const created: string[] = [];
  for (const sub of due) {
    if (sub.invoices.length > 0) continue; // sudah ada tagihan menunggu
    const invoice = await createInvoice({
      storeId: sub.storeId,
      tier: sub.tier,
      cycle: sub.cycle,
      subscriptionId: sub.id,
      description: `Perpanjangan ${TIER_LABELS[sub.tier]} ${sub.cycle.toLowerCase()}`,
    });
    if (sub.expiresAt && sub.expiresAt.getTime() < now.getTime()) {
      await prisma.storeSubscription.update({
        where: { id: sub.id },
        data: { status: "PAST_DUE" },
      });
    }
    created.push(invoice.invoiceNumber);
  }

  return created;
}
