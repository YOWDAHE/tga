import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { comments, news, users } from '../db/schema';
import { eq } from 'drizzle-orm';


function containsObfuscatedLink(text: string): boolean {
  if (!text) return false;

  // Normalize: remove spaces, dots, brackets, and common obfuscation chars between words
  let normalized = text
    .replace(/[\s\[\]\(\)\{\}]+/g, '') // remove spaces and brackets
    .replace(/(?:dot|dt|d0t|\(dot\)|\[dot\]|\.|\s*\.\s*)/gi, '.') // replace obfuscated 'dot' with '.'
    .replace(/(?:slash|\/|\\|\s*\/\s*)/gi, '/'); // replace obfuscated 'slash' with '/'

  // 1. Standard URL regex (http, https, www, etc.)
  const urlRegex = /\b((https?:\/\/|www\.)[^\s/$.?#].[^\s]*)/i;
  if (urlRegex.test(normalized)) return true;

  // 2. Domain-like pattern (example.com, example.co.uk, etc.)
  const domainRegex = /\b[a-z0-9\-]+(\.[a-z]{2,}){1,3}\b/i;
  if (domainRegex.test(normalized)) return true;

  // 3. Obfuscated "dot" or "slash" (example dot com, example[.]com, h t t p : / /)
  const obfuscatedDot = /\b[a-z0-9\-]+(\s*(\.|dot|\[dot\]|\(dot\))\s*)+[a-z]{2,}\b/gi;
  if (obfuscatedDot.test(text)) return true;

  // 4. Obfuscated protocol (h t t p, hxxp, etc.)
  const obfuscatedProtocol = /(h\s*t\s*t\s*p|hxxp|h\W*t\W*t\W*p)/i;
  if (obfuscatedProtocol.test(text)) return true;

  return false;
}

// --- CRUD ---

const get = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await db.select().from(comments);
    res.status(200).json({
      message: 'Comments fetched successfully',
      status: 'success',
      error: null,
      data,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch comments',
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
    const data = await db.select().from(comments).where(eq(comments.id, id));
    if (data.length === 0) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'Comment fetched successfully',
      status: 'success',
      error: null,
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch comment',
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
    const { news_id, user_name, content } = req.body;
    if (!news_id || !user_name || !content) {
      res.status(400).json({
        message: 'news_id, user_name, and content are required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    // Check for obfuscated links
    const flaged = containsObfuscatedLink(content);

    const [created] = await db.insert(comments).values({
      news_id,
      user_name,
      content,
      flaged,
    }).returning();

    res.status(201).json({
      message: 'Comment created successfully',
      status: 'success',
      error: null,
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create comment',
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
    const { content } = req.body;

    // Check for obfuscated links
    const flaged = content ? containsObfuscatedLink(content) : undefined;

    const [updated] = await db
      .update(comments)
      .set({
        content,
        flaged,
        edited: true,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'Comment updated successfully',
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update comment',
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
    const [deleted] = await db.delete(comments).where(eq(comments.id, id)).returning();
    if (!deleted) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }
    res.status(200).json({
      message: 'Comment deleted successfully',
      status: 'success',
      error: null,
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete comment',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, getById, create, update, remove };