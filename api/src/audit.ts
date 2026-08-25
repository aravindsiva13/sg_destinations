import { prisma } from './prisma.js';
import type { JwtPayload } from './auth/tokens.js';

/**
 * Records an audit-log entry. Never throws — auditing must not break the
 * underlying request, so failures are swallowed and logged to the console.
 */
export async function recordAudit(params: {
  actor?: JwtPayload | null;
  action: string;
  entity: string;
  entityId?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.actor?.sub ?? null,
        actor: params.actor?.name ?? params.actor?.email ?? 'system',
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
      },
    });
  } catch (err) {
    console.error('audit write failed', err);
  }
}
