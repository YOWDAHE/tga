import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from '../types/api';
import { file_upload } from '../types/documents';
import { document_create } from '../models/document.model';
import pdfParse from 'pdf-parse';
import { db } from '../db';
import { categories, documents } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from './audit.controller';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const docs = await db.select().from(documents);
    if (docs.length === 0) {
      res.status(404).json({
        message: 'No Upload data found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'successfully fetched all uploads',
      status: 'success',
      error: null,
      data: docs,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({
        message: 'ID parameter is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    const data = await db.select().from(documents).where(eq(documents.id, Number(id)));
    if (data.length === 0) {
      res.status(404).json({
        message: 'Upload not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    res.status(200).json({
      message: 'Upload fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    next(error);
  }
};

const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { category_id, title, author } = req.body;
    if (!req.file) {
      res.status(400).json({
        message: "File is required",
        status: 'error',
        error: "Validation error",
        data: null,
      });
      return;
    }
    if (!title || !category_id) {
      res.status(400).json({
        message: "Filename and category_id are required",
        status: 'error',
        error: "Validation error",
        data: null,
      });
      return;
    }
    const category = await db.select().from(categories).where(eq(categories.id, Number(category_id)));
    if (category.length === 0) {
      res.status(404).json({
        message: "Category not found",
        status: 'error',
        error: "Not found",
        data: null,
      });
      return;
    }
    // 1. Extract text from PDF
    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);
    const content_text = pdfData.text;
    // 2. Upload file to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'uploads', resource_type: 'raw' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(pdfBuffer);
    });
    // 3.Save both URLs in the DB
    const [created] = await db.insert(documents).values({
      filename: req.file.originalname,
      file_size: req.file.size,
      title: title || req.file.originalname,
      category_id: Number(category_id),
      author,
      content_text,
      file_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    }).returning();
    await logAudit({
      tableName: 'documents',
      action: 'INSERT',
      description: 'Uploaded document',
      oldData: null,
      newData: created,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(201).json({
      message: "File uploaded and document created successfully",
      status: 'success',
      error: null,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to upload file or create document",
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
    res.status(200).json({ message: `UPDATE upload by id: ${req.params.id}` });
  } catch (error) {
    next(error);
  }
};

const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const oldDoc = await db.select().from(documents).where(eq(documents.id, Number(id)));
    await cloudinary.uploader.destroy(id);
    await logAudit({
      tableName: 'documents',
      action: 'DELETE',
      description: 'Deleted uploaded document',
      oldData: oldDoc[0] || null,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
    res.status(200).json({ message: `Deleted upload with public_id: ${id}` });
  } catch (error) {
    next(error);
  }
};

export default { get, getById, create, update, remove };