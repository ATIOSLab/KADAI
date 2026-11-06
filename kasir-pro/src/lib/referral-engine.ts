import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * MESIN KOMISI REFERRAL KADAI
 * Alur: Invoice lunas -> atribusi ke ReferralLead -> komisi terakumulasi ->
 *       generatePayoutBatch (bulanan) -> ReferralPayout PENDING -> dicairkan admin.
 * Semua operasi idempotent agar cron/webhook aman dijalankan berulang.
 */

export function monthlyPeriod(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Atribusi komisi pada invoice yang lunas — idempotent per invoice. */
export async function attributeInvoiceToReferral(
  tx: Prisma.TransactionClient,
  args: { invoiceId: string; amount: Prisma.Decimal; storeId: string; storePhone: string | null }
): Promise<void> {
  const invoice = await tx.paymentInvoice.findUnique({
    where: { id: args.invoiceId },
    select: { referralLeadId: true, commissionEarned: true },
  });
  if (!invoice || invoice.referralLeadId) return; // sudah diatribusikan

  const phone = args.storePhone?.replace(/[^0-9]/g, "");
  if (!phone) return;

  // Cocokkan ke lead paling awal (first-touch) dengan nomor belakang 10 digit.
  const lead = await tx.referralLead.findFirst({
    where: { phone: { contains: phone.slice(-10) } },
    orderBy: { createdAt: "asc" },
    include: { partner: { select: { status: true, commissionRate: true } } },
  });
  if (!lead || lead.partner.status !== "ACTIVE") return;

  const rate = lead.partner.commissionRate.toNumber();
  const commission = args.amount.mul(rate).div(100);

  await tx.referralLead.update({
    where: { id: lead.id },
    data: {
      status: "SUBSCRIBED",
      linkedStoreId: lead.linkedStoreId ?? args.storeId,
      subscriptionAmount: { increment: args.amount },
      commissionEarned: { increment: commission },
    },
  });

  await tx.paymentInvoice.update({
    where: { id: args.invoiceId },
    data: { referralLeadId: lead.id, commissionEarned: commission },
  });
}

/** Buat batch payout bulanan per mitra aktif — idempotent (unik partner+period). */
export async function generatePayoutBatch(period: string = monthlyPeriod()): Promise<{
  generated: number;
  totalAmount: number;
  partners: number;
}> {
  const leads = await prisma.referralLead.findMany({
    where: { status: { not: "CHURNED" } },
    select: {
      id: true,
      partnerId: true,
      commissionEarned: true,
      commissionPaid: true,
      partner: { select: { status: true } },
    },
  });

  const byPartner = new Map<string, { pending: number; leadIds: { id: string; earned: number }[] }>();
  for (const lead of leads) {
    if (lead.partner.status !== "ACTIVE") continue;
    const diff = lead.commissionEarned.toNumber() - lead.commissionPaid.toNumber();
    if (diff <= 0) continue;
    const group = byPartner.get(lead.partnerId) ?? { pending: 0, leadIds: [] };
    group.pending += diff;
    group.leadIds.push({ id: lead.id, earned: lead.commissionEarned.toNumber() });
    byPartner.set(lead.partnerId, group);
  }

  let generated = 0;
  let totalAmount = 0;
  for (const [partnerId, group] of byPartner) {
    const existing = await prisma.referralPayout.findUnique({
      where: { partnerId_period: { partnerId, period } },
    });
    if (existing && existing.status !== "PENDING") continue; // payout periode tsb sudah final

    await prisma.referralPayout.upsert({
      where: { partnerId_period: { partnerId, period } },
      create: { partnerId, amount: group.pending, period, status: "PENDING" },
      update: { amount: group.pending, status: "PENDING" },
    });

    // Tandai komisi periode ini sebagai "sudah masuk payout" (anti double-pay)
    for (const { id, earned } of group.leadIds) {
      await prisma.referralLead.update({
        where: { id },
        data: { commissionPaid: earned },
      });
    }

    generated += 1;
    totalAmount += group.pending;
  }

  return { generated, totalAmount, partners: byPartner.size };
}
