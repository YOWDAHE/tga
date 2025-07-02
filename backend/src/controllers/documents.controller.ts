import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { documents as documentsTable } from '../db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import type { document_create } from '../models/document.model';
import { logAudit } from './audit.controller';

// In-memory cache for top 5 most viewed documents
let topViewedCache: any[] = [];

async function updateTopViewedCache() {
  topViewedCache = await db
    .select()
    .from(documentsTable)
    .orderBy(desc(documentsTable.view_count))
    .limit(5);
}

const getTopViewed = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.status(200).json({
      message: 'Top 5 most viewed documents',
      status: 'success',
      error: null,
      data: topViewedCache,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch top viewed documents',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// GET all documents with pagination and search
const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    let countQuery;
    if (search) {
      countQuery = db.select({ count: sql<number>`count(*)` }).from(documentsTable).where(
        sql`${documentsTable.title} ILIKE ${`%${search}%`} OR ${documentsTable.filename} ILIKE ${`%${search}%`} OR ${documentsTable.author} ILIKE ${`%${search}%`}`
      );
    } else {
      countQuery = db.select({ count: sql<number>`count(*)` }).from(documentsTable);
    }

    const [{ count }] = await countQuery;
    const totalPages = Math.ceil(count / limit);

    // Get paginated data
    let data;
    if (search) {
      data = await db.select()
        .from(documentsTable)
        .where(
          sql`${documentsTable.title} ILIKE ${`%${search}%`} OR ${documentsTable.filename} ILIKE ${`%${search}%`} OR ${documentsTable.author} ILIKE ${`%${search}%`}`
        )
        .orderBy(desc(documentsTable.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      data = await db.select()
        .from(documentsTable)
        .orderBy(desc(documentsTable.createdAt))
        .limit(limit)
        .offset(offset);
    }

    res.status(200).json({
      message: 'Documents fetched successfully',
      status: 'success',
      error: null,
      data: {
        documents: data,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch documents',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// GET document by ID
const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await db.update(documentsTable)
      .set({
        view_count: sql`${documentsTable.view_count} + 1`,
      })
      .where(eq(documentsTable.id, id))

    updateTopViewedCache();

    res.status(200).json({
      message: 'Document fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch document',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// UPDATE document metadata (not file)
const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { filename, title, category_id, author } = req.body as Partial<document_create>;
    const oldDoc = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    const [updated] = await db
      .update(documentsTable)
      .set({ filename, title, category_id, author, updatedAt: new Date() })
      .where(eq(documentsTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'documents',
      action: 'UPDATE',
      description: 'Updated document',
      oldData: oldDoc[0] || null,
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Document updated successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update document',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// DELETE document (and remove from Cloudinary)
const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    // Get document to find Cloudinary public_id
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    // Delete from Cloudinary
    await cloudinary.uploader.destroy(doc.public_id, { resource_type: 'raw' });
    // Delete from DB
    const [deleted] = await db.delete(documentsTable).where(eq(documentsTable.id, id)).returning();
    await logAudit({
      tableName: 'documents',
      action: 'DELETE',
      description: 'Deleted document',
      oldData: doc,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Document deleted successfully',
      status: 'success',
      error: null,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete document',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, getById, update, remove };