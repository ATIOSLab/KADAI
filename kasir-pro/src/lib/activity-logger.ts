import { prisma } from "./prisma";
import { ActionType } from "@prisma/client";

interface LogActivityParams {
  userId: string;
  action: ActionType;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logActivity({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? (details as object) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't let logging failures break the main operation
    console.error("Failed to log activity:", error);
  }
}
