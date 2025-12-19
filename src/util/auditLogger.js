import prisma from '../../src/prismaClient.js';

export const logAudit = async ({
  actorId,
  actorRole,
  action,
  entity,
  entityId,
  metadata = null,
  ipAddress = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        actorRole,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
};


export const logAudits = async ({
  req,
  action,
  entity,
  entityId,
  metadata = {},
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: req.user?.id ?? null,
        actorRole: req.user?.role ?? 'SYSTEM', // ✅ FIX
        action,
        entity,
        entityId,
        metadata: JSON.stringify(metadata),
        ipAddress: req.ip || null,
      },
    });
  } catch (error) {
    console.error('❌ Audit log failed:', error);
  }
};
