import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { news } from '../db/schema';
import { v2 as cloudinary } from 'cloudinary';
import { eq, desc, asc, count, like, or } from 'drizzle-orm';
import { logAudit } from './audit.controller';


const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'desc',
      q = '',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const allowedSortFields = ['createdAt', 'updatedAt', 'published_date', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Build search condition
    let whereCondition = undefined;
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereCondition = or(
        like(news.title, searchTerm),
        like(news.content, searchTerm),
        like(news.created_by, searchTerm),
        like(news.source, searchTerm)
      );
    }

    // Get total count for pagination
    const totalCountQuery = whereCondition 
      ? db.select({ count: count() }).from(news).where(whereCondition)
      : db.select({ count: count() }).from(news);
    const totalCount = await totalCountQuery;

    // Execute the main query with ordering and pagination
    const dataQuery = whereCondition
      ? db.select().from(news).where(whereCondition)
      : db.select().from(news);
    
    // Dynamic sorting based on sortField
    let sortedQuery;
    if (sortField === 'createdAt') {
      sortedQuery = order === 'asc' ? asc(news.createdAt) : desc(news.createdAt);
    } else if (sortField === 'updatedAt') {
      sortedQuery = order === 'asc' ? asc(news.updatedAt) : desc(news.updatedAt);
    } else if (sortField === 'published_date') {
      sortedQuery = order === 'asc' ? asc(news.published_date) : desc(news.published_date);
    } else if (sortField === 'title') {
      sortedQuery = order === 'asc' ? asc(news.title) : desc(news.title);
    } else {
      // Default fallback
      sortedQuery = desc(news.createdAt);
    }
    
    const data = await dataQuery
      .orderBy(sortedQuery)
      .limit(pageSize)
      .offset((pageNum - 1) * pageSize);

    res.status(200).json({
      message: 'News fetched successfully',
      status: 'success',
      error: null,
      data: {
        news: data,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount[0].count / pageSize),
          totalItems: totalCount[0].count,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const getById = async (
  req: Request,
  res: Response,
  next: NextFunction, 
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await db.select().from(news).where(eq(news.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'News not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'News fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};


const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { title, content, published_date, created_by } = req.body;
    let visual_content: string[] | null = null;
    if (req.files && Array.isArray(req.files)) {
      visual_content = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        visual_content.push(url);
      }
    } else if (req.file) {
      const url = await uploadToCloudinary(req.file.buffer);
      visual_content = [url];
    }
    const [created] = await db.insert(news).values({
      title,
      content,
      visual_content,
      published_date: published_date ? new Date(published_date) : new Date(),
      created_by: created_by || 'admin',
      source: 'Admin',
    }).returning();
    await logAudit({
      tableName: 'news',
      action: 'INSERT',
      description: 'Created news',
      oldData: null,
      newData: created,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(201).json({
      message: 'News created successfully',
      status: 'success',
      error: null,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { title, content, published_date, created_by } = req.body;
    let visual_content: string[] | null = null;
    if (req.files && Array.isArray(req.files)) {
      visual_content = [];
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer);
        visual_content.push(url);
      }
    } else if (req.file) {
      const url = await uploadToCloudinary(req.file.buffer);
      visual_content = [url];
    }
    const oldNews = await db.select().from(news).where(eq(news.id, id));
    const [updated] = await db
      .update(news)
      .set({
        title,
        content,
        visual_content,
        published_date: published_date ? new Date(published_date) : undefined,
        created_by,
        updatedAt: new Date(),
      })
      .where(eq(news.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({
        message: 'News not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'news',
      action: 'UPDATE',
      description: 'Updated news',
      oldData: oldNews[0] || null,
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'News updated successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const oldNews = await db.select().from(news).where(eq(news.id, id));
    const [deleted] = await db.delete(news).where(eq(news.id, id)).returning();
    if (!deleted) {
      res.status(404).json({
        message: 'News not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'news',
      action: 'DELETE',
      description: 'Deleted news',
      oldData: oldNews[0] || null,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'News deleted successfully',
      status: 'success',
      error: null,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete news',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'news' },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

export default { get, getById, create, update, remove };