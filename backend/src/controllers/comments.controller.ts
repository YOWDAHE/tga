import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { comments, news, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logAudit } from './audit.controller';


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

const getByNewsId = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const news_id = Number(req.params.news_id);
    const { username } = req.query; // Get username from query params
    
    const data = await db.select().from(comments).where(eq(comments.news_id, news_id));
    
    // Transform the data to include like/dislike counts and user status
    const transformedData = data.map(comment => {
      const likes = Array.isArray(comment.likes) ? comment.likes : [];
      const dislikes = Array.isArray(comment.dislikes) ? comment.dislikes : [];
      
      return {
        ...comment,
        likes_count: likes.length,
        dislikes_count: dislikes.length,
        liked: username ? likes.includes(username as string) : false,
        disliked: username ? dislikes.includes(username as string) : false,
        // likes,
        // dislikes
      };
    });

    res.status(200).json({
      message: 'Comments fetched successfully',
      status: 'success',
      error: null,
      data: transformedData,
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

const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { news_id, user_name, content } = req.body;
    if (!news_id || !content) {
      res.status(400).json({
        message: 'news_id, user_name, and content are required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    // Check for obfuscated links
    const flagged = containsObfuscatedLink(content);

    const [created] = await db.insert(comments).values({
      news_id,
      user_name,
      content,
      flagged,
      flagged_reason: flagged ? 'Might contain obfuscated link' : null,
    }).returning();

    await logAudit({
      tableName: 'comments',
      action: 'INSERT',
      description: 'Created comment',
      oldData: null,
      newData: created,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

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
    const flagged = content ? containsObfuscatedLink(content) : undefined;

    const oldComment = await db.select().from(comments).where(eq(comments.id, id));

    const [updated] = await db
      .update(comments)
      .set({
        content,
        flagged,
        flagged_reason: flagged ? 'Might contain obfuscated link' : null,
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

    await logAudit({
      tableName: 'comments',
      action: 'UPDATE',
      description: 'Updated comment',
      oldData: oldComment[0] || null,
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

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
    const oldComment = await db.select().from(comments).where(eq(comments.id, id));
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
    await logAudit({
      tableName: 'comments',
      action: 'DELETE',
      description: 'Deleted comment',
      oldData: oldComment[0] || null,
      newData: null,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });
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

const toggleFlag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    
    const oldComment = await db.select().from(comments).where(eq(comments.id, id));
    if (oldComment.length === 0) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    const currentFlagged = oldComment[0].flagged;
    const [updated] = await db
      .update(comments)
      .set({
        flagged: !currentFlagged,
        flagged_reason: !currentFlagged ? (reason || 'Flagged by admin') : null,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    await logAudit({
      tableName: 'comments',
      action: 'UPDATE',
      description: currentFlagged ? 'Unflagged comment' : 'Flagged comment',
      oldData: oldComment[0],
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    res.status(200).json({
      message: `Comment ${currentFlagged ? 'unflagged' : 'flagged'} successfully`,
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to toggle comment flag',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const toggleVisibility = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    
    const oldComment = await db.select().from(comments).where(eq(comments.id, id));
    if (oldComment.length === 0) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    const currentVisible = oldComment[0].visible;
    const [updated] = await db
      .update(comments)
      .set({
        visible: !currentVisible,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    await logAudit({
      tableName: 'comments',
      action: 'UPDATE',
      description: currentVisible ? 'Hidden comment' : 'Showed comment',
      oldData: oldComment[0],
      newData: updated,
      user_id: req.user?.id,
      changedBy: req.user?.username,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string,
    });

    res.status(200).json({
      message: `Comment ${currentVisible ? 'hidden' : 'shown'} successfully`,
      status: 'success',
      error: null,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to toggle comment visibility',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const toggleLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { username, action } = req.body; // action can be 'like' or 'dislike'
    
    if (!username) {
      res.status(400).json({
        message: 'Username is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    if (!['like', 'dislike'].includes(action)) {
      res.status(400).json({
        message: 'Action must be either "like" or "dislike"',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }
    
    const oldComment = await db.select().from(comments).where(eq(comments.id, id));
    if (oldComment.length === 0) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    const comment = oldComment[0];
    const likes = Array.isArray(comment.likes) ? comment.likes : [];
    const dislikes = Array.isArray(comment.dislikes) ? comment.dislikes : [];
    
    let newLikes = [...likes];
    let newDislikes = [...dislikes];
    
    if (action === 'like') {
      // If user already liked, remove the like
      if (likes.includes(username)) {
        newLikes = likes.filter(name => name !== username);
      } else {
        // Add like and remove from dislikes if present
        if (!likes.includes(username)) {
          newLikes.push(username);
        }
        newDislikes = dislikes.filter(name => name !== username);
      }
    } else if (action === 'dislike') {
      // If user already disliked, remove the dislike
      if (dislikes.includes(username)) {
        newDislikes = dislikes.filter(name => name !== username);
      } else {
        // Add dislike and remove from likes if present
        if (!dislikes.includes(username)) {
          newDislikes.push(username);
        }
        newLikes = likes.filter(name => name !== username);
      }
    }

    const [updated] = await db
      .update(comments)
      .set({
        likes: newLikes,
        dislikes: newDislikes,
        updatedAt: new Date(),
      })
      .where(eq(comments.id, id))
      .returning();

    // Transform the response to include counts and user status
    const transformedComment = {
      ...updated,
      likes_count: newLikes.length,
      dislikes_count: newDislikes.length,
      liked: newLikes.includes(username),
      disliked: newDislikes.includes(username),
      likes: newLikes,
      dislikes: newDislikes
    };

    res.status(200).json({
      message: `Comment ${action} toggled successfully`,
      status: 'success',
      error: null,
      data: transformedComment,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to toggle like',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

const removeOwnComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const currentUsername = req.user?.username; // Get username from JWT token
    
    if (!currentUsername) {
      res.status(401).json({
        message: 'Authentication required',
        status: 'error',
        error: 'User not authenticated',
        data: null,
      });
      return;
    }

    // First check if the comment exists and belongs to the current user
    const existingComment = await db.select().from(comments).where(eq(comments.id, id));
    
    if (existingComment.length === 0) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    const comment = existingComment[0];
    
    // Check if the comment belongs to the current user
    if (comment.user_name !== currentUsername) {
      res.status(403).json({
        message: 'You can only delete your own comments',
        status: 'error',
        error: 'Forbidden',
        data: null,
      });
      return;
    }

    // Delete the comment
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

const editOwnComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const { content } = req.body;
    const currentUsername = req.user?.username;
    
    if (!currentUsername) {
      res.status(401).json({
        message: 'Authentication required',
        status: 'error',
        error: 'User not authenticated',
        data: null,
      });
      return;
    }

    if (!content || content.trim() === '') {
      res.status(400).json({
        message: 'Content is required',
        status: 'error',
        error: 'Validation error',
        data: null,
      });
      return;
    }

    // First check if the comment exists and belongs to the current user
    const existingComment = await db.select().from(comments).where(eq(comments.id, id));
    
    if (existingComment.length === 0) {
      res.status(404).json({
        message: 'Comment not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    const comment = existingComment[0];
    
    // Check if the comment belongs to the current user
    if (comment.user_name !== currentUsername) {
      res.status(403).json({
        message: 'You can only edit your own comments',
        status: 'error',
        error: 'Forbidden',
        data: null,
      });
      return;
    }

    // Check for obfuscated links in the new content
    const flagged = containsObfuscatedLink(content);

    // Update the comment
    const [updated] = await db
      .update(comments)
      .set({
        edited: true,
        content: content.trim(),
        flagged,
        flagged_reason: flagged ? 'Might contain obfuscated link' : null,
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

export default { get, getById, getByNewsId, create, update, remove, toggleFlag, toggleVisibility, toggleLike, removeOwnComment, editOwnComment };