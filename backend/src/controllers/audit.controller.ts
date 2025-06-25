
import { InferModel } from 'drizzle-orm';
import { db } from '../db';
import { auditLog } from '../db/schema';

type AuditLogEntry = InferModel<typeof auditLog, 'insert'>;

export async function logAudit(
    entry: Omit<AuditLogEntry, 'changeTimestamp' | 'id'>
) {
    try {
        await db.insert(auditLog).values(entry);
    } catch (error) {
        console.error('Failed to log audit event:', error);
    }
}