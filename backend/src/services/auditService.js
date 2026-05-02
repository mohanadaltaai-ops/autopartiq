import { prisma } from '../db.js';

export async function writeAuditLog(input) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      metadataJson: JSON.stringify(input.metadata || {})
    }
  });
}
