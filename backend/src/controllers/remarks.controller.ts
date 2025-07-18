import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { remarks } from '../db/schema';
import { eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { logAudit } from './audit.controller';

// GET all remarks
const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await db.select().from(remarks);
    res.status(200).json({
      message: 'Remarks fetched successfully',
      status: 'success',
      error: null,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch remarks',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// GET remark by ID
const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await db.select().from(remarks).where(eq(remarks.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'Remark not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'Remark fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch remark',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// CREATE remark
const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email, content } = req.body;
    if (!name || !email || !content) {
      res.status(400).json({
        message: 'Name, email, and content are required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }
    const [created] = await db.insert(remarks).values({ name, email, content }).returning();
    
    res.status(201).json({
      message: 'Remark created successfully',
      status: 'success',
      error: null,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create remark',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// UPDATE remark
const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { name, email, content } = req.body;
    const oldRemark = await db.select().from(remarks).where(eq(remarks.id, id));
    const [updated] = await db
      .update(remarks)
      .set({ name, email, content, updatedAt: new Date() })
      .where(eq(remarks.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({
        message: 'Remark not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'remarks',
      action: 'UPDATE',
      description: 'Updated remark',
      oldData: oldRemark[0] || null,
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Remark updated successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update remark',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// REMOVE remark
const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const oldRemark = await db.select().from(remarks).where(eq(remarks.id, id));
    const [deleted] = await db.delete(remarks).where(eq(remarks.id, id)).returning();
    if (!deleted) {
      res.status(404).json({
        message: 'Remark not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    await logAudit({
      tableName: 'remarks',
      action: 'DELETE',
      description: 'Deleted remark',
      oldData: oldRemark[0] || null,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({
      message: 'Remark deleted successfully',
      status: 'success',
      error: null,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete remark',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// REPLY to a remark via email
const reply = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { subject, response } = req.body;
    if (!subject || !response) {
      res.status(400).json({
        message: 'Subject and message are required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    // Fetch the remark to get the user's email
    const data = await db.select().from(remarks).where(eq(remarks.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'Remark not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    const userEmail = data[0].email;

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send the email
    transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: userEmail,
      subject,
      text: response,
    }, async (err, data) => {
      if (err) {
        res.status(500).json({
          message: 'Failed to send reply',
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
          data: null,
        });
        next(err);
      } else {
        const [updated] = await db.update(remarks).set({ response, updatedAt: new Date() }).where(eq(remarks.id, id)).returning();
        await logAudit({
          tableName: 'remarks',
          action: 'UPDATE',
          description: 'Replied to remark',
          oldData: null,
          newData: updated,
          user_id: req.user?.id,
          changedBy: req.user?.username,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string,
        });
        res.status(200).json({
          message: 'Reply sent successfully',
          status: 'success',
          error: null,
          data: null,
        });
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Failed to send reply',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, getById, create, update, remove, reply };