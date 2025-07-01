import { Request, Response, NextFunction } from 'express';
import { InferModel } from 'drizzle-orm';
import { db } from '../db';
import { auditLog } from '../db/schema';
import { desc, eq, like, and, gte, lte } from 'drizzle-orm';

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

// GET all audit logs with filtering and pagination
export const getAuditLogs = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const {
            page = 1,
            limit = 50,
            tableName,
            action,
            changedBy,
            startDate,
            endDate,
            user_id
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        
        // Build where conditions
        const conditions = [];
        
        if (tableName) {
            conditions.push(like(auditLog.tableName, `%${tableName}%`));
        }
        
        if (action) {
            conditions.push(eq(auditLog.action, action as 'INSERT' | 'UPDATE' | 'DELETE'));
        }
        
        if (changedBy) {
            conditions.push(like(auditLog.changedBy, `%${changedBy}%`));
        }
        
        if (user_id) {
            conditions.push(eq(auditLog.user_id, Number(user_id)));
        }
        
        if (startDate) {
            conditions.push(gte(auditLog.changeTimestamp, new Date(startDate as string)));
        }
        
        if (endDate) {
            conditions.push(lte(auditLog.changeTimestamp, new Date(endDate as string)));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const data = await db
            .select()
            .from(auditLog)
            .where(whereClause)
            .orderBy(desc(auditLog.changeTimestamp))
            .limit(Number(limit))
            .offset(offset);

        // Get total count for pagination
        const totalCount = await db
            .select({ count: auditLog.id })
            .from(auditLog)
            .where(whereClause);

        res.status(200).json({
            message: 'Audit logs fetched successfully',
            status: 'success',
            error: null,
            data: {
                logs: data,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalCount.length,
                    totalPages: Math.ceil(totalCount.length / Number(limit))
                }
            },
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch audit logs',
            status: 'error',
            error: error instanceof Error ? error.message : error,
            data: null,
        });
        next(error);
    }
};

// GET audit log by ID
export const getAuditLogById = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const id = Number(req.params.id);
        const data = await db.select().from(auditLog).where(eq(auditLog.id, id));
        
        if (data.length === 0) {
            res.status(404).json({
                message: 'Audit log not found',
                status: 'error',
                error: 'Not found',
                data: null,
            });
            return;
        }

        res.status(200).json({
            message: 'Audit log fetched successfully',
            status: 'success',
            error: null,
            data: data[0],
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch audit log',
            status: 'error',
            error: error instanceof Error ? error.message : error,
            data: null,
        });
        next(error);
    }
};

// GET audit logs by table name
export const getAuditLogsByTable = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { tableName } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const data = await db
            .select()
            .from(auditLog)
            .where(eq(auditLog.tableName, tableName))
            .orderBy(desc(auditLog.changeTimestamp))
            .limit(Number(limit))
            .offset(offset);

        const totalCount = await db
            .select({ count: auditLog.id })
            .from(auditLog)
            .where(eq(auditLog.tableName, tableName));

        res.status(200).json({
            message: `Audit logs for ${tableName} fetched successfully`,
            status: 'success',
            error: null,
            data: {
                logs: data,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalCount.length,
                    totalPages: Math.ceil(totalCount.length / Number(limit))
                }
            },
        });
    } catch (error) {
        res.status(500).json({
            message: 'Failed to fetch audit logs by table',
            status: 'error',
            error: error instanceof Error ? error.message : error,
            data: null,
        });
        next(error);
    }
};