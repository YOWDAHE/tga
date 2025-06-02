import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { category_create } from '../models/category.model';

const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await db.select().from(categories);
    res.status(200).json({
      message: 'Categories fetched successfully',
      status: 'success',
      error: null,
      data,
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
    const id = Number(req.params.id);
    const { name, description } = req.body as category_create;
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
    const [deleted] = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (!deleted) {
      res.status(404).json({
        message: 'Category not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
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