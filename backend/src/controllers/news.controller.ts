import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { news } from '../db/schema';
import { v2 as cloudinary } from 'cloudinary';
import { eq, desc, asc, count, like, or } from 'drizzle-orm';
import { logAudit } from './audit.controller';
import TelegramBot from 'node-telegram-bot-api';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: false }); // Set polling to false since we only send messages
const channelId = process.env.TELEGRAM_CHANNEL_ID!;




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
    console.log('Create news - req.files:', req.files);
    console.log('Create news - req.file:', req.file);
    console.log('Create news - req.body:', req.body);
    
    let visual_content: any[] | null = null;
    if (req.files && Array.isArray(req.files)) {
      visual_content = [];
      for (const file of req.files) {
        console.log('Processing file:', file.originalname, file.size);
        try {
          const uploadResult = await uploadToCloudinary(file.buffer);
          visual_content.push(uploadResult);
        } catch (error) {
          console.error('Failed to upload file to Cloudinary:', error);
          throw error;
        }
      }
    } else if (req.file) {
      console.log('Processing single file:', req.file.originalname, req.file.size);
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        visual_content = [uploadResult];
      } catch (error) {
        console.error('Failed to upload file to Cloudinary:', error);
        throw error;
      }
    }
    // Send to Telegram channel first to get message ID
    const telegramMessageId = await sendNewsToTelegram({
      title,
      content,
      visual_content,
      published_date: published_date ? new Date(published_date) : new Date(),
      created_by: created_by || 'admin',
      source: 'Website',
    });

    const [created] = await db.insert(news).values({
      title,
      content,
      visual_content,
      published_date: published_date ? new Date(published_date) : new Date(),
      created_by: created_by || 'admin',
      source: 'Website',
      telegram_message_id: telegramMessageId,
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
    let visual_content: any[] | null = null;
    if (req.files && Array.isArray(req.files)) {
      visual_content = [];
      for (const file of req.files) {
        try {
          const uploadResult = await uploadToCloudinary(file.buffer);
          visual_content.push(uploadResult);
        } catch (error) {
          console.error('Failed to upload file to Cloudinary:', error);
          throw error;
        }
      }
    } else if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        visual_content = [uploadResult];
      } catch (error) {
        console.error('Failed to upload file to Cloudinary:', error);
        throw error;
      }
    }
    const oldNews = await db.select().from(news).where(eq(news.id, id));
    
    // Delete old images from Cloudinary if new images are being uploaded or if images are being removed
    if (oldNews[0]?.visual_content && Array.isArray(oldNews[0].visual_content)) {
      if (visual_content && visual_content.length > 0) {
        // New images are being uploaded, delete old ones
        await deleteMultipleFromCloudinary(oldNews[0].visual_content);
      } else if (!visual_content || visual_content.length === 0) {
        // Images are being removed, delete old ones
        await deleteMultipleFromCloudinary(oldNews[0].visual_content);
      }
    }
    
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
    
    // Edit Telegram message only if it was originally created by website
    // This prevents editing news that came from Telegram
    if (oldNews[0]?.source === 'Website' && oldNews[0]?.telegram_message_id) {
      await editTelegramMessage(oldNews[0].telegram_message_id, updated);
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
    
    if (oldNews.length === 0) {
      res.status(404).json({
        message: 'News not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Delete images from Cloudinary before deleting from database
    if (oldNews[0].visual_content && Array.isArray(oldNews[0].visual_content)) {
      await deleteMultipleFromCloudinary(oldNews[0].visual_content);
    }

    // Delete from Telegram if it was originally created by website
    if (oldNews[0].source === 'Website') {
      await deleteFromTelegram(id);
    }

    const [deleted] = await db.delete(news).where(eq(news.id, id)).returning();
    
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

async function uploadToCloudinary(buffer: Buffer): Promise<{ public_id: string; secure_url: string }> {
  return await new Promise<{ public_id: string; secure_url: string }>((resolve, reject) => {
    console.log('Starting Cloudinary upload, buffer size:', buffer.length);
    
    const uploadStream = cloudinary.uploader.upload_stream(
      { 
        folder: 'news',
        timeout: 60000, // 60 seconds timeout
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        if (!result) {
          console.error('Cloudinary upload failed - no result');
          return reject(new Error('Upload failed - no result'));
        }
        console.log('Cloudinary upload successful:', result.public_id);
        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url
        });
      }
    );
    
    uploadStream.end(buffer);
  });
}

async function deleteFromCloudinary(imageData: string | { public_id: string; secure_url: string }): Promise<void> {
  try {
    let publicId: string;
    
    if (typeof imageData === 'string') {
      // Handle legacy string URLs
      const urlParts = imageData.split('/');
      const filenameWithExtension = urlParts[urlParts.length - 1];
      publicId = `news/${filenameWithExtension.split('.')[0]}`;
    } else {
      // Handle new object structure
      publicId = imageData.public_id;
    }
    
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image from Cloudinary: ${publicId}`);
  } catch (error) {
    console.error(`Error deleting image from Cloudinary:`, imageData, error);
    // Don't throw error to avoid breaking the main deletion flow
  }
}

async function deleteMultipleFromCloudinary(images: any[]): Promise<void> {
  if (!images || images.length === 0) return;
  
  const deletePromises = images.map(image => deleteFromCloudinary(image));
  await Promise.allSettled(deletePromises);
}

async function sendNewsToTelegram(newsData: any): Promise<number | null> {
  try {
    if (!token || !channelId) {
      console.log('Telegram bot token or channel ID not configured');
      return null;
    }

    const caption = `${newsData.title}\n\n${newsData.content}`;
    
    let telegramMessageId: number | null = null;
    
    if (newsData.visual_content && newsData.visual_content.length > 0) {
      if (newsData.visual_content.length === 1) {
        // Send single photo with caption
        const imageUrl = typeof newsData.visual_content[0] === 'string' 
          ? newsData.visual_content[0] 
          : newsData.visual_content[0].secure_url;
        const result = await bot.sendPhoto(channelId, imageUrl, {
          caption: caption,
          parse_mode: 'HTML'
        });
        telegramMessageId = result.message_id;
      } else {
        // Send multiple photos as media group
        const media = newsData.visual_content.map((imageData: any, index: number) => ({
          type: 'photo',
          media: typeof imageData === 'string' ? imageData : imageData.secure_url,
          caption: index === 0 ? caption : undefined, // Only first photo gets caption
          parse_mode: 'HTML'
        }));
        
        const result = await bot.sendMediaGroup(channelId, media);
        // For media groups, we store the first message ID
        telegramMessageId = result[0]?.message_id || null;
      }
    } else {
      // Send text only
      const result = await bot.sendMessage(channelId, caption, {
        parse_mode: 'HTML'
      });
      console.log(`Telegram message ID: ${result}`);
      telegramMessageId = result.message_id;
    }
    
    console.log('News sent to Telegram successfully');
    return telegramMessageId;
  } catch (error) {
    console.error('Error sending news to Telegram:', error);
    // Don't throw error to avoid breaking the main news creation flow
    return null;
  }
}

async function editTelegramMessage(messageId: number, newsData: any): Promise<void> {
  try {
    if (!token || !channelId) {
      console.log('Telegram bot token or channel ID not configured');
      return;
    }

    const caption = `${newsData.title}\n\n${newsData.content}`;
    
    if (newsData.visual_content && newsData.visual_content.length > 0) {
      if (newsData.visual_content.length === 1) {
        // Edit photo with new caption
        await bot.editMessageCaption(caption, {
          chat_id: channelId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        console.log(`Edited Telegram message ${messageId} with new caption`);
      } else {
        // For multiple images, we can only edit the caption of the first image
        // Note: Telegram doesn't support editing media groups, so we'll edit the caption only
        await bot.editMessageCaption(caption, {
          chat_id: channelId,
          message_id: messageId,
          parse_mode: 'HTML'
        });
        console.log(`Edited Telegram message ${messageId} caption (media group)`);
      }
    } else {
      // Edit text message
      await bot.editMessageText(caption, {
        chat_id: channelId,
        message_id: messageId,
        parse_mode: 'HTML'
      });
      console.log(`Edited Telegram message ${messageId} with new text`);
    }
  } catch (error) {
    console.error(`Error editing Telegram message ${messageId}:`, error);
    // Don't throw error to avoid breaking the main update flow
  }
}

async function deleteFromTelegram(newsId: number): Promise<void> {
  try {
    if (!token || !channelId) {
      console.log('Telegram bot token or channel ID not configured');
      return;
    }

    // Get the news item to find the telegram_message_id
    const newsItem = await db.select().from(news).where(eq(news.id, newsId));
    if (newsItem.length === 0) {
      console.log(`News item not found for ID: ${newsId}`);
      return;
    }

    const telegramMessageId = newsItem[0].telegram_message_id;
    if (!telegramMessageId) {
      console.log(`No Telegram message ID found for news ID: ${newsId}`);
      return;
    }

    await bot.deleteMessage(channelId, telegramMessageId);
    console.log(`Deleted Telegram message ${telegramMessageId} for news ID ${newsId}`);
  } catch (error) {
    console.error(`Error deleting Telegram message for news ID ${newsId}:`, error);
    // Don't throw error to avoid breaking the main deletion flow
  }
}

export default { get, getById, create, update, remove };