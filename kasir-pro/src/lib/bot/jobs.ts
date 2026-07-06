import {
  BotJobStatus,
  BotJobType,
  Prisma,
  type BotJob,
} from "@prisma/client";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/prisma";

const LOCK_STALE_MINUTES = 5;

export async function enqueueBotJob(params: {
  type: BotJobType;
  payload: Prisma.InputJsonValue;
  dedupeKey?: string;
}) {
  try {
    return await prisma.botJob.create({
      data: {
        type: params.type,
        payload: params.payload,
        dedupeKey: params.dedupeKey,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      params.dedupeKey
    ) {
      return prisma.botJob.findFirst({
        where: {
          dedupeKey: params.dedupeKey,
        },
      });
    }

    throw error;
  }
}

export async function claimNextBotJob() {
  const now = new Date();
  const staleLockCutoff = addMinutes(now, -LOCK_STALE_MINUTES);
  const candidates = await prisma.botJob.findMany({
    where: {
      status: BotJobStatus.PENDING,
      nextRetryAt: {
        lte: now,
      },
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleLockCutoff } }],
    },
    orderBy: [{ nextRetryAt: "asc" }, { createdAt: "asc" }],
    take: 5,
  });

  for (const candidate of candidates) {
    const claimed = await prisma.botJob.updateMany({
      where: {
        id: candidate.id,
        status: BotJobStatus.PENDING,
        OR: [{ lockedAt: null }, { lockedAt: { lt: staleLockCutoff } }],
      },
      data: {
        status: BotJobStatus.PROCESSING,
        lockedAt: now,
        errorMessage: null,
        attemptCount: {
          increment: 1,
        },
      },
    });

    if (claimed.count > 0) {
      return prisma.botJob.findUnique({
        where: {
          id: candidate.id,
        },
      });
    }
  }

  return null;
}

export async function completeBotJob(jobId: string) {
  await prisma.botJob.update({
    where: { id: jobId },
    data: {
      status: BotJobStatus.COMPLETED,
      lockedAt: null,
      nextRetryAt: new Date(),
    },
  });
}

export async function rescheduleBotJob(job: BotJob, errorMessage: string) {
  const retryDelayMinutes = Math.min(job.attemptCount * 2, 15);

  await prisma.botJob.update({
    where: { id: job.id },
    data: {
      status: BotJobStatus.PENDING,
      lockedAt: null,
      nextRetryAt: addMinutes(new Date(), retryDelayMinutes),
      errorMessage,
    },
  });
}

export async function failBotJob(jobId: string, errorMessage: string) {
  await prisma.botJob.update({
    where: { id: jobId },
    data: {
      status: BotJobStatus.FAILED,
      lockedAt: null,
      errorMessage,
    },
  });
}
