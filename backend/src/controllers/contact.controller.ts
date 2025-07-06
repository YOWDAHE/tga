import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { contactUsInfo } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from './audit.controller';

// GET all contact info
const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await db.select().from(contactUsInfo);
    res.status(200).json({
      message: 'Contact info fetched successfully',
      status: 'success',
      error: null,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch contact info',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// GET contact info by ID
const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await db.select().from(contactUsInfo).where(eq(contactUsInfo.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'Contact info not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'Contact info fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch contact info',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// CREATE contact info
const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { medium, email, phone_number } = req.body;
    if (!medium) {
      res.status(400).json({
        message: 'Medium is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }
    const [created] = await db.insert(contactUsInfo).values({ medium, email, phone_number }).returning();
    await logAudit({
      tableName: 'contact_us_info',
      action: 'INSERT',
      description: 'Created contact info',
      oldData: null,
      newData: created,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(201).json({
      message: 'Contact info created successfully',
      status: 'success',
      error: null,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create contact info',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// UPDATE contact info
const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { medium, email, phone_number } = req.body;
    const oldContactInfo = await db.select().from(contactUsInfo).where(eq(contactUsInfo.id, id));
    const [updated] = await db
      .update(contactUsInfo)
      .set({ medium, email, phone_number, updatedAt: new Date() })
      .where(eq(contactUsInfo.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({
        message: 'Contact info not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'contact_us_info',
      action: 'UPDATE',
      description: 'Updated contact info',
      oldData: oldContactInfo[0] || null,
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Contact info updated successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update contact info',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// REMOVE contact info
const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const oldContactInfo = await db.select().from(contactUsInfo).where(eq(contactUsInfo.id, id));
    const [deleted] = await db.delete(contactUsInfo).where(eq(contactUsInfo.id, id)).returning();
    if (!deleted) {
      res.status(404).json({
        message: 'Contact info not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'contact_us_info',
      action: 'DELETE',
      description: 'Deleted contact info',
      oldData: oldContactInfo[0] || null,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Contact info deleted successfully',
      status: 'success',
      error: null,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete contact info',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, getById, create, update, remove }; 