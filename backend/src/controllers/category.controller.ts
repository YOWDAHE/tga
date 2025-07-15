import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { category_create } from '../models/category.model';
import { logAudit } from './audit.controller';
import { documents } from '../db/schema';
import { news } from '../db/schema';
import { like, or } from 'drizzle-orm';

const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause = undefined;

    if (search) {
      whereClause = or(
        like(categories.name, `%${search}%`),
        like(categories.description || '', `%${search}%`)
      );
    }

    // Get total count for pagination
    const totalCategories = await db.select().from(categories).where(whereClause);
    const totalCount = totalCategories.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Get paginated results
    const data = await db.select().from(categories).where(whereClause).limit(limit).offset(offset);

    res.status(200).json({
      message: 'Categories fetched successfully',
      status: 'success',
      error: null,
      data: {
        categories: data,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch categories',
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
    const data = await db.select().from(categories).where(eq(categories.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'Category not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'Category fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch category',
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
    const { name, description } = req.body as category_create;
    if (!name) {
      res.status(400).json({
        message: 'Name is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }
    const [created] = await db.insert(categories).values({ name, description }).returning();
    await logAudit({
      tableName: 'categories',
      action: 'INSERT',
      description: 'Created category',
      oldData: null,
      newData: created,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(201).json({
      message: 'Category created successfully',
      status: 'success',
      error: null,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create category',
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
    console.log("Updating category ", req.body);
    const id = Number(req.params.id);
    const { name, description } = req.body as category_create;
    const oldCategory = await db.select().from(categories).where(eq(categories.id, id));
    const [updated] = await db
      .update(categories)
      .set({ name, description, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({
        message: 'Category not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'categories',
      action: 'UPDATE',
      description: 'Updated category',
      oldData: oldCategory[0] || null,
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Category updated successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update category',
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
    
    // Check if category exists
    const [existingCategory] = await db.select().from(categories).where(eq(categories.id, id));
    if (!existingCategory) {
      res.status(404).json({
        message: 'Category not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Check if category is being used by documents
    const documentsUsingCategory = await db.select().from(documents).where(eq(documents.category_id, id));
    if (documentsUsingCategory.length > 0) {
      res.status(400).json({
        message: `Cannot delete category. It is being used by ${documentsUsingCategory.length} document(s).`,
        status: 'error',
        error: 'Foreign key constraint',
        data: {
          documentsCount: documentsUsingCategory.length,
          documentIds: documentsUsingCategory.map(doc => doc.id)
        },
      });
      return;
    }

    // Check if category is being used by news (optional check since it's nullable)
    const newsUsingCategory = await db.select().from(news).where(eq(news.category_id, id));
    if (newsUsingCategory.length > 0) {
      // For news, we can set category_id to null instead of preventing deletion
      await db.update(news)
        .set({ category_id: null, updatedAt: new Date() })
        .where(eq(news.category_id, id));
    }

    // Delete the category
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    
    await logAudit({
      tableName: 'categories',
      action: 'DELETE',
      description: 'Deleted category',
      oldData: existingCategory,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    res.status(200).json({
      message: 'Category deleted successfully',
      status: 'success',
      error: null,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete category',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, getById, create, update, remove };