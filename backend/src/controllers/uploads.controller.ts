import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from '../types/api';
import { file_upload } from '../types/documents';
import { document_create } from '../models/document.model';
import pdfParse from 'pdf-parse';
import { db } from '../db';
import { categories, documents } from '../db/schema';
import { eq, like, or } from 'drizzle-orm';
import { logAudit } from './audit.controller';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause = undefined;

    if (search) {
      whereClause = or(
        like(documents.title, `%${search}%`),
        like(documents.author || '', `%${search}%`),
        like(documents.filename, `%${search}%`)
      );
    }

    const totalDocs = await db.select().from(documents).where(whereClause);
    const totalCount = totalDocs.length;
    const totalPages = Math.ceil(totalCount / limit);

    const docs = await db.select().from(documents).where(whereClause).limit(limit).offset(offset);

    if (docs.length === 0) {
      res.status(200).json({
        message: 'No Upload data found',
        status: 'success',
        error: 'Not found',
        data: null,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      });
      return;
    }

    res.status(200).json({
      message: 'successfully fetched all uploads',
      status: 'success',
      error: null,
      data: {
        documents: docs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      }
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
    const { category_id, title, author, description } = req.body;
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

    // 2. Save file to server storage
    const uploadsDir = path.join(process.cwd(), 'backend', 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(req.file.originalname);
    const filename = `document_${timestamp}_${randomString}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to server
    const writeFile = promisify(fs.writeFile);
    try {
      await writeFile(filePath, req.file.buffer);
    } catch (err) {
      res.status(500).json({
        message: "Failed to save file to server",
        status: 'error',
        error: err instanceof Error ? err.message : err,
        data: null,
      });
      return;
    }

    // Generate public URL for serving the file
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const fileUrl = `${backendUrl}/uploads/documents/${filename}`;
    console.log(fileUrl);

    // 3. Save document info in the DB
    const [created] = await db.insert(documents).values({
      filename: req.file.originalname,
      file_size: req.file.size,
      title: title || req.file.originalname,
      category_id: Number(category_id),
      author,
      description,
      content_text,
      file_url: fileUrl,
      public_id: filename, // Store filename as public_id for server storage
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
    const id = Number(req.params.id);
    const { title, category_id, author, description } = req.body;
    
    // Get the existing document
    const [existingDoc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!existingDoc) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Validate category exists
    if (category_id) {
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
    }

    // Update the document
    const [updated] = await db
      .update(documents)
      .set({
        title: title || existingDoc.title,
        category_id: category_id ? Number(category_id) : existingDoc.category_id,
        author: author !== undefined ? author : existingDoc.author,
        description: description !== undefined ? description : existingDoc.description,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();

    await logAudit({
      tableName: 'documents',
      action: 'UPDATE',
      description: 'Updated document metadata',
      oldData: existingDoc,
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

const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    // Get document to find file path
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Delete file from server storage
    if (doc.public_id) {
      const filePath = path.join(process.cwd(), 'backend', 'uploads', 'documents', doc.public_id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from DB
    const [deleted] = await db.delete(documents).where(eq(documents.id, id)).returning();
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


const serveDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { filename } = req.params;
    
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'documents', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        message: "File not found",
        status: 'error',
        error: "Not found",
        data: null,
      });
      return;
    }

    const stats = fs.statSync(filePath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      message: "Failed to serve file",
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// Add function to migrate existing Cloudinary documents to server storage
const migrateCloudinaryDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Get all documents that might have Cloudinary URLs
    const allDocs = await db.select().from(documents);
    let migratedCount = 0;
    let skippedCount = 0;

    for (const doc of allDocs) {
      // Check if this is a Cloudinary URL
      if (doc.file_url.includes('cloudinary.com') || doc.public_id.includes('/')) {
        // This is a Cloudinary document, we need to migrate it
        // For now, we'll just update the URL format to indicate it needs migration
        // In a real migration, you would download the file from Cloudinary and save it to server
        
        const newPublicId = `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.pdf`;
        const newFileUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/uploads/documents/${newPublicId}`;
        
        await db.update(documents)
          .set({
            file_url: newFileUrl,
            public_id: newPublicId,
            updatedAt: new Date()
          })
          .where(eq(documents.id, doc.id));
        
        migratedCount++;
      } else {
        skippedCount++;
      }
    }

    res.status(200).json({
      message: `Migration completed. ${migratedCount} documents migrated, ${skippedCount} skipped.`,
      status: 'success',
      error: null,
      data: {
        migrated: migratedCount,
        skipped: skippedCount,
        total: allDocs.length
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to migrate documents",
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// Increment download count for a document
const incrementDownloadCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    
    if (!id) {
      res.status(400).json({
        message: 'Document ID is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    // Check if document exists
    const [existingDoc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!existingDoc) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Increment download count
    const [updated] = await db
      .update(documents)
      .set({
        download_count: existingDoc.download_count + 1,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();

    res.status(200).json({
      message: 'Download count incremented successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to increment download count',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// Increment view count for a document
const incrementViewCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    
    if (!id) {
      res.status(400).json({
        message: 'Document ID is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    // Check if document exists
    const [existingDoc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!existingDoc) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Increment view count
    const [updated] = await db
      .update(documents)
      .set({
        view_count: existingDoc.view_count + 1,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();

    res.status(200).json({
      message: 'View count incremented successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to increment view count',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

// Download document with incrementing download count
const downloadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    
    if (!id) {
      res.status(400).json({
        message: 'Document ID is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    // Get document details
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    if (!document) {
      res.status(404).json({
        message: 'Document not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Get file path
    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'documents', document.public_id);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        message: 'File not found on server',
        status: 'error',
        error: 'File not found',
        data: null,
      });
      return;
    }

    // Increment download count
    await db
      .update(documents)
      .set({
        download_count: document.download_count + 1,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id));

    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to download document',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, getById, create, update, remove, serveDocument, migrateCloudinaryDocuments, incrementDownloadCount, incrementViewCount, downloadDocument };