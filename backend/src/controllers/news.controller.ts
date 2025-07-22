import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { news, categories, news_links, comments } from '../db/schema';
import { eq, like, or, desc, asc, and, count } from 'drizzle-orm';
import { logAudit } from './audit.controller';
import TelegramBot from 'node-telegram-bot-api';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

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
      category = '',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(Number(page), 1);
    const pageSize = Math.max(Number(limit), 1);
    const allowedSortFields = ['createdAt', 'updatedAt', 'published_date', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Build search condition
    let whereConditions = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      whereConditions.push(or(
        like(news.title, searchTerm),
        like(news.content, searchTerm),
        like(news.created_by, searchTerm),
        like(news.source, searchTerm),
        like(news.hashtags, searchTerm),
        like(categories.name, searchTerm)
      ));
    }

    if (category && category.trim()) {
      const categoryId = parseInt(category.trim());
      if (!isNaN(categoryId)) {
        whereConditions.push(eq(categories.id, categoryId));
      }
    }

    const whereCondition = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count for pagination
    const totalCountQuery = whereCondition
      ? db.select({ count: count() }).from(news).leftJoin(categories, eq(news.category_id, categories.id)).where(whereCondition)
      : db.select({ count: count() }).from(news).leftJoin(categories, eq(news.category_id, categories.id));
    const totalCount = await totalCountQuery;

    // Execute the main query with ordering and pagination
    const dataQuery = whereCondition
      ? db.select({ news: news, category: categories }).from(news).leftJoin(categories, eq(news.category_id, categories.id)).where(whereCondition)
      : db.select({ news: news, category: categories }).from(news).leftJoin(categories, eq(news.category_id, categories.id));

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

    // Combine news data with category information
    const newsData = data.map(item => ({
      ...item.news,
      category: item.category
    }));

    // Log visual content for debugging
    console.log('News data visual content:', newsData.map(item => ({
      id: item.id,
      title: item.title,
      visual_content: item.visual_content
    })));

    res.status(200).json({
      message: 'News fetched successfully',
      status: 'success',
      error: null,
      data: {
        news: newsData,
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
    const data = await db
      .select({
        news: news,
        category: categories
      })
      .from(news)
      .leftJoin(categories, eq(news.category_id, categories.id))
      .where(eq(news.id, id));

    if (data.length === 0) {
      res.status(404).json({
        message: 'News not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    // Combine news data with category information
    const newsData = {
      ...data[0].news,
      category: data[0].category
    };

    res.status(200).json({
      message: 'News fetched successfully',
      status: 'success',
      error: null,
      data: newsData,
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

const publicGetById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const data = await db.select().from(news).where(eq(news.id, id));

    await db.update(news).set({
      view_count: data[0].view_count + 1
    }).where(eq(news.id, id));

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

const publicNews = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Featured: top 5 featured
    const featured = await db.select().from(news)
      .where(eq(news.featured, true))
      .orderBy(desc(news.createdAt))
      .limit(5);
    // Latest: top 5 by createdAt
    const latest = await db.select().from(news)
      .orderBy(desc(news.createdAt))
      .limit(5);
    // Trending: top 5 by view_count
    const trending = await db.select().from(news)
      .orderBy(desc(news.view_count))
      .limit(5);
    // Hot: top 5 by comment count
    const hot = await db
      .select({
        news: news,
        commentCount: count(comments.id)
      })
      .from(news)
      .leftJoin(comments, eq(news.id, comments.news_id))
      .groupBy(news.id)
      .orderBy(desc(count(comments.id)))
      .limit(5)
      .then(results => results.map(result => result.news));
    // Others: all news_links
    const newsLinks = await db.select().from(news_links).orderBy(desc(news_links.createdAt)).limit(4);
    res.status(200).json({
      message: 'Public news fetched successfully',
      status: 'success',
      error: null,
      data: { featured, latest, trending, hot, others: newsLinks },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch public news',
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
    const { title, content, published_date, created_by, hashtags, featured, read_minutes, category_id } = req.body;
    console.log('Create news - req.files:', req.files);
    console.log('Create news - req.file:', req.file);
    console.log('Create news - req.body:', req.body);

    let imageUrls: string[] = [];
    let visual_content: string[] | null = null;

    if (req.files && Array.isArray(req.files)) {
      console.log('Processing multiple files:', req.files.length);
      imageUrls = await uploadImagesToLocal(req.files);
      visual_content = imageUrls;
    } else if (req.file) {
      console.log('Processing single file:', req.file.originalname, req.file.size);
      imageUrls = await uploadImagesToLocal([req.file]);
      visual_content = imageUrls;
    }

    // Send to Telegram channel first to get message IDs
    const telegramMessageIds = await sendNewsToTelegram({
      title,
      content,
      visual_content: visual_content?.map(url => ({ secure_url: url, public_id: url.split('/').pop() })),
      published_date: published_date ? new Date(published_date) : new Date(),
      created_by: created_by || 'admin',
      source: 'Website',
    });

    // Prepare image buffers for LinkedIn
    const imageBuffers: Buffer[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        imageBuffers.push(file.buffer);
      }
    } else if (req.file) {
      imageBuffers.push(req.file.buffer);
    }

    // Send to LinkedIn
    // const linkedinPostId = await sendNewsToLinkedIn({
    //   title,
    //   content,
    //   visual_content,
    //   published_date: published_date ? new Date(published_date) : new Date(),
    //   created_by: created_by || 'admin',
    //   source: 'Website',
    // }, imageBuffers);

    // Send to Twitter
    const twitterPostId = await sendNewsToTwitter({
      title,
      content,
      visual_content: visual_content?.map(url => ({ secure_url: url, public_id: url.split('/').pop() })),
      published_date: published_date ? new Date(published_date) : new Date(),
      created_by: created_by || 'admin',
      source: 'Website',
      hashtags,
    }, imageBuffers);

    // Only store Twitter message ID if the post was successful
    const twitterMessageId = twitterPostId !== null ? twitterPostId : null;

    const [created] = await db.insert(news).values({
      title,
      content,
      visual_content,
      hashtags,
      category_id: category_id ? Number(category_id) : null,
      featured,
      read_minutes,
      published_date: published_date ? new Date(published_date) : new Date(),
      created_by: created_by || 'admin',
      source: 'Website',
      telegram_message_id: telegramMessageIds,
      // linkedin_message_id: linkedinPostId,
      twitter_message_id: twitterMessageId,
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
    const { title, content, published_date, created_by, hashtags, featured, read_minutes, category_id, visual_content: incomingVisualContent } = req.body;

    // Get the existing news item first
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

    // Parse incoming visual_content (from frontend) if present
    let newVisualContent: string[] = [];
    if (incomingVisualContent) {
      if (Array.isArray(incomingVisualContent)) {
        newVisualContent = incomingVisualContent;
      } else if (typeof incomingVisualContent === 'string') {
        try {
          newVisualContent = JSON.parse(incomingVisualContent);
        } catch {
          newVisualContent = [incomingVisualContent];
        }
      }
    }

    // Existing images from DB
    const oldVisualContent: string[] = Array.isArray(oldNews[0].visual_content) ? oldNews[0].visual_content : [];

    // Upload new images if present
    let uploadedImageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      uploadedImageUrls = await uploadImagesToLocal(req.files);
    } else if (req.file) {
      uploadedImageUrls = await uploadImagesToLocal([req.file]);
    }

    // Merge: keep images from frontend + add new uploads
    // The frontend should send the images it wants to keep in visual_content
    // So, the final visual_content = [...newVisualContent, ...uploadedImageUrls]
    const finalVisualContent: string[] = [...newVisualContent, ...uploadedImageUrls];

    // Find images to delete: those in oldVisualContent but not in finalVisualContent
    const imagesToDelete = oldVisualContent.filter(img => !finalVisualContent.includes(img));
    if (imagesToDelete.length > 0) {
      await deleteImagesFromLocal(imagesToDelete);
    }

    const [updated] = await db
      .update(news)
      .set({
        title,
        content,
        visual_content: finalVisualContent,
        hashtags,
        category_id: category_id ? Number(category_id) : null,
        featured,
        read_minutes,
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
      const messageIds = Array.isArray(oldNews[0].telegram_message_id)
        ? oldNews[0].telegram_message_id as number[]
        : [oldNews[0].telegram_message_id as number];
      await editTelegramMessage(messageIds, updated);
    }

    // Prepare image buffers for LinkedIn if new images are uploaded
    const imageBuffers: Buffer[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        imageBuffers.push(file.buffer);
      }
    } else if (req.file) {
      imageBuffers.push(req.file.buffer);
    }

    // Edit LinkedIn post only if it was originally created by website
    if (oldNews[0]?.source === 'Website' && oldNews[0]?.linkedin_message_id) {
      await editLinkedInPost(oldNews[0].linkedin_message_id as string, updated, imageBuffers);
    }

    // Edit Twitter post only if it was originally created by website
    if (oldNews[0]?.source === 'Website' && oldNews[0]?.twitter_message_id) {
      await editTwitterPost(oldNews[0].twitter_message_id as string, updated, imageBuffers);
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

    // Delete related comments first (due to foreign key constraint)
    await db.delete(comments).where(eq(comments.news_id, id));

    // Delete images from local storage before deleting from database
    if (oldNews[0].visual_content && Array.isArray(oldNews[0].visual_content)) {
      await deleteImagesFromLocal(oldNews[0].visual_content);
    }

    // Delete from Telegram if it was originally created by website
    if (oldNews[0].source === 'Website') {
      await deleteFromTelegram(id);
    }

    // Delete from LinkedIn if it was originally created by website
    if (oldNews[0].source === 'Website' && oldNews[0].linkedin_message_id) {
      await deleteFromLinkedIn(oldNews[0].linkedin_message_id as string);
    }

    // Delete from Twitter if it was originally created by website
    if (oldNews[0].source === 'Website' && oldNews[0].twitter_message_id) {
      console.log('Attempting to delete Twitter post with ID:', oldNews[0].twitter_message_id);
      console.log('Twitter message ID type:', typeof oldNews[0].twitter_message_id);
      await deleteFromTwitter(oldNews[0].twitter_message_id as string);
    } else {
      console.log('Skipping Twitter deletion - conditions not met:', {
        source: oldNews[0].source,
        twitter_message_id: oldNews[0].twitter_message_id,
        hasTwitterId: !!oldNews[0].twitter_message_id
      });
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

// Helper function to upload images to local storage
async function uploadImagesToLocal(files: Express.Multer.File[]): Promise<string[]> {
  const uploadsDir = path.join(process.cwd(), 'backend', 'uploads', 'news-images');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const imageUrls: string[] = [];
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  for (const file of files) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Generate unique filename (like documents - no ID needed)
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `news_${timestamp}_${randomString}${fileExtension}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to server
    const writeFile = promisify(fs.writeFile);
    await writeFile(filePath, file.buffer);

    // Generate URL for the image
    const imageUrl = `${backendUrl}/uploads/news-images/${filename}`;
    imageUrls.push(imageUrl);
  }

  return imageUrls;
}



// Helper function to delete images from local storage
async function deleteImagesFromLocal(imageUrls: string[]): Promise<void> {
  for (const imageUrl of imageUrls) {
    try {
      const filename = imageUrl.split('/').pop();
      if (filename) {
        const filePath = path.join(process.cwd(), 'backend', 'uploads', 'news-images', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to delete image file:', error);
    }
  }
}

// Helper function to convert markdown to HTML for Telegram
function markdownToHtml(text: string): string {
  // Convert markdown links to HTML links
  let htmlText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert markdown bold to HTML bold
  htmlText = htmlText.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  // Convert markdown italic to HTML italic
  htmlText = htmlText.replace(/\*([^*]+)\*/g, '<i>$1</i>');

  // Convert markdown underline to HTML underline
  htmlText = htmlText.replace(/<u>([^<]+)<\/u>/g, '<u>$1</u>');

  return htmlText;
}

// Helper to split text into chunks of maxLength
function splitText(text: string, maxLength: number): string[] {
  const result = [];
  let i = 0;
  while (i < text.length) {
    result.push(text.slice(i, i + maxLength));
    i += maxLength;
  }
  return result;
}

async function sendNewsToTelegram(newsData: any): Promise<number[]> {
  try {
    if (!token || !channelId) {
      console.log('Telegram bot token or channel ID not configured');
      return [];
    }

    const MAX_CAPTION = 1024;
    const MAX_MESSAGE = 4096;
    const fullText = `${markdownToHtml(newsData.title)}\n\n${markdownToHtml(newsData.content)}`;
    const caption = fullText.slice(0, MAX_CAPTION);
    const rest = fullText.slice(MAX_CAPTION);

    let telegramMessageIds: number[] = [];

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
        telegramMessageIds = [result.message_id];
      } else {
        // Send multiple photos as media group
        const media = newsData.visual_content.map((imageData: any, index: number) => ({
          type: 'photo',
          media: typeof imageData === 'string' ? imageData : imageData.secure_url,
          caption: index === 0 ? caption : undefined, // Only first photo gets caption
          parse_mode: 'HTML'
        }));
        const result = await bot.sendMediaGroup(channelId, media);
        telegramMessageIds = result.map((msg: any) => msg.message_id);
      }
    } else {
      // Send text only (no image)
      const chunks = splitText(fullText, MAX_MESSAGE);
      for (const chunk of chunks) {
        const result = await bot.sendMessage(channelId, chunk, { parse_mode: 'HTML' });
        telegramMessageIds.push(result.message_id);
      }
    }

    // Send the rest of the text (if any) as additional messages
    if (rest.length > 0) {
      const chunks = splitText(rest, MAX_MESSAGE);
      for (const chunk of chunks) {
        await bot.sendMessage(channelId, chunk, { parse_mode: 'HTML' });
      }
    }

    console.log('News sent to Telegram successfully');
    return telegramMessageIds;
  } catch (error) {
    console.error('Error sending news to Telegram:', error);
    return [];
  }
}

async function editTelegramMessage(messageIds: number[], newsData: any): Promise<void> {
  try {
    if (!token || !channelId) {
      console.log('Telegram bot token or channel ID not configured');
      return;
    }

    const caption = `${markdownToHtml(newsData.title)}\n\n${markdownToHtml(newsData.content)}`;

    // For editing, we can only edit the caption of the first message in a media group
    const firstMessageId = messageIds[0];
    if (!firstMessageId) {
      console.log('No message IDs to edit');
      return;
    }

    if (newsData.visual_content && newsData.visual_content.length > 0) {
      if (newsData.visual_content.length === 1) {
        // Edit photo with new caption
        await bot.editMessageCaption(caption, {
          chat_id: channelId,
          message_id: firstMessageId,
          parse_mode: 'HTML'
        });
        console.log(`Edited Telegram message ${firstMessageId} with new caption`);
      } else {
        // For multiple images, we can only edit the caption of the first image
        // Note: Telegram doesn't support editing media groups, so we'll edit the caption only
        await bot.editMessageCaption(caption, {
          chat_id: channelId,
          message_id: firstMessageId,
          parse_mode: 'HTML'
        });
        console.log(`Edited Telegram message ${firstMessageId} caption (media group)`);
      }
    } else {
      // Edit text message
      await bot.editMessageText(caption, {
        chat_id: channelId,
        message_id: firstMessageId,
        parse_mode: 'HTML'
      });
      console.log(`Edited Telegram message ${firstMessageId} with new text`);
    }
  } catch (error) {
    console.error(`Error editing Telegram messages:`, error);
    // Don't throw error to avoid breaking the main update flow
  }
}

async function deleteFromTelegram(newsId: number): Promise<void> {
  try {
    if (!token || !channelId) {
      console.log('Telegram bot token or channel ID not configured');
      return;
    }

    // Get the news item to find the telegram_message_ids
    const newsItem = await db.select().from(news).where(eq(news.id, newsId));
    if (newsItem.length === 0) {
      console.log(`News item not found for ID: ${newsId}`);
      return;
    }

    const telegramMessageIds = newsItem[0].telegram_message_id;
    if (!telegramMessageIds || !Array.isArray(telegramMessageIds) || telegramMessageIds.length === 0) {
      console.log(`No Telegram message IDs found for news ID: ${newsId}`);
      return;
    }

    // Delete all messages in the array
    for (const messageId of telegramMessageIds) {
      try {
        await bot.deleteMessage(channelId, messageId);
        console.log(`Deleted Telegram message ${messageId} for news ID ${newsId}`);
      } catch (error) {
        console.error(`Error deleting Telegram message ${messageId}:`, error);
        // Continue with other messages even if one fails
      }
    }
  } catch (error) {
    console.error(`Error deleting Telegram messages for news ID ${newsId}:`, error);
    // Don't throw error to avoid breaking the main deletion flow
  }
}

// LinkedIn posting functions
async function uploadImageToLinkedIn(imageBuffer: Buffer): Promise<string | null> {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const apiUrl = process.env.LINKEDIN_API;
    const sub = process.env.LINKEDIN_SUB;

    if (!accessToken || !apiUrl || !sub) {
      console.log('LinkedIn credentials not configured');
      return null;
    }

    // First, register the image upload
    const registerResponse = await fetch(`${apiUrl}/assets?action=registerUpload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: `urn:li:person:${sub}`,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      })
    });

    if (!registerResponse.ok) {
      const errorText = await registerResponse.text();
      console.error('LinkedIn register upload error:', registerResponse.status, errorText);
      return null;
    }

    const registerResult = await registerResponse.json();
    const uploadUrl = registerResult.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
    const asset = registerResult.value.asset;

    // Upload the image buffer directly to LinkedIn
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('LinkedIn image upload error:', uploadResponse.status, errorText);
      return null;
    }

    console.log('Image uploaded to LinkedIn successfully:', asset);
    return asset;
  } catch (error) {
    console.error('Error uploading image to LinkedIn:', error);
    return null;
  }
}

async function sendNewsToLinkedIn(newsData: any, imageBuffers?: Buffer[]): Promise<string | null> {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const sub = process.env.LINKEDIN_SUB;
    const apiUrl = process.env.LINKEDIN_API;

    if (!accessToken || !sub || !apiUrl) {
      console.log('LinkedIn credentials not configured');
      return null;
    }

    // Upload images if present
    let mediaAssets: any[] = [];
    if (imageBuffers && imageBuffers.length > 0) {
      for (let i = 0; i < imageBuffers.length; i++) {
        try {
          const asset = await uploadImageToLinkedIn(imageBuffers[i]);
          if (asset) {
            mediaAssets.push({
              status: 'READY',
              description: {
                text: newsData.title
              },
              media: asset,
              title: {
                text: newsData.title
              }
            });
          } else {
            console.error(`Failed to upload image ${i + 1}/${imageBuffers.length} to LinkedIn`);
            return null;
          }
        } catch (error) {
          console.error(`Error uploading image ${i + 1}/${imageBuffers.length} to LinkedIn:`, error);
          return null;
        }
      }
    }

    // Escape markdown link syntax characters for LinkedIn
    const escapeLinkedInText = (text: string): string => {
      return text
        .replace(/\[/g, '')
        .replace(/\]/g, '')
        .replace(/\(/g, '')
        .replace(/\)/g, '');
    };

    const escapedTitle = escapeLinkedInText(newsData.title);
    const escapedContent = escapeLinkedInText(newsData.content);

    // Create the post content
    const postContent: any = {
      author: `urn:li:person:${sub}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: `${escapedTitle}\n\n${escapedContent}`
          },
          shareMediaCategory: mediaAssets.length > 0 ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    // Add media assets if available
    if (mediaAssets.length > 0) {
      postContent.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAssets;
    }

    const response = await fetch(`${apiUrl}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(postContent)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LinkedIn API error:', response.status, errorText);
      return null;
    }

    const postId = response.headers.get('x-restli-id');
    if (!postId) {
      console.error('LinkedIn API did not return x-restli-id header');
      return null;
    }

    console.log('News posted to LinkedIn successfully:', postId);
    console.log('LinkedIn response headers:', Object.fromEntries(response.headers.entries()));
    return postId;
  } catch (error) {
    console.error('Error posting to LinkedIn:', error);
    return null;
  }
}

async function editLinkedInPost(linkedinPostId: string, newsData: any, imageBuffers?: Buffer[]): Promise<void> {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const apiUrl = process.env.LINKEDIN_API;

    if (!accessToken || !apiUrl || !linkedinPostId) {
      console.log('LinkedIn credentials or post ID not configured');
      return;
    }

    await deleteFromLinkedIn(linkedinPostId);

    await sendNewsToLinkedIn(newsData, imageBuffers);
  } catch (error) {
    console.error('Error editing LinkedIn post:', error);
  }
}

async function deleteFromLinkedIn(linkedinPostId: string): Promise<void> {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    const apiUrl = process.env.LINKEDIN_API;

    if (!accessToken || !apiUrl || !linkedinPostId) {
      console.log('LinkedIn credentials or post ID not configured');
      return;
    }
    let formattedPostId = linkedinPostId;

    if (!linkedinPostId.startsWith('urn:li:')) {
      formattedPostId = `urn:li:share:${linkedinPostId}`;
    }

    const encodedPostId = formattedPostId.replace(/:/g, '%3A');
    let deleteUrls: string[];
    if (formattedPostId.startsWith('urn:li:share:')) {
      const shareId = formattedPostId.replace('urn:li:share:', '');
      const ugcPostId = `urn:li:ugcPost:${shareId}`;
      const encodedUgcPostId = ugcPostId.replace(/:/g, '%3A');

      console.log('Share URN detected, will try both formats:', formattedPostId, 'and', ugcPostId);

      // Try both share and ugcPost formats
      deleteUrls = [
        `${apiUrl}/ugcPosts/${encodedPostId}`,
        `${apiUrl}/ugcPosts/${encodedUgcPostId}`,
        `${apiUrl}/ugcPosts/${encodeURIComponent(ugcPostId)}`
      ];
    } else {
      // For ugcPost URNs, use the standard format
      deleteUrls = [
        `${apiUrl}/ugcPosts/${encodedPostId}`,
        `${apiUrl}/ugcPosts/${encodeURIComponent(formattedPostId)}`
      ];
    }

    let success = false;
    for (const deleteUrl of deleteUrls) {
      try {
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        });

        if (response.ok) {
          console.log(`Deleted LinkedIn post successfully using URL: ${deleteUrl}`);
          success = true;
          break;
        } else {
          const errorText = await response.text();
          console.log(`Failed to delete with URL ${deleteUrl}:`, response.status, errorText);
        }
      } catch (error) {
        console.log(`Error with URL ${deleteUrl}:`, error);
      }
    }

    if (!success) {
      console.error('Failed to delete LinkedIn post with all URL formats');
    }
  } catch (error) {
    console.error(`Error deleting LinkedIn post ${linkedinPostId}:`, error);
    // Don't throw error to avoid breaking the main deletion flow
  }
}

// Twitter integration functions
async function uploadImageToTwitter(imageBuffer: Buffer): Promise<string | null> {
  try {
    const { TwitterApi } = require('twitter-api-v2');

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_KEY_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });

    console.log('Uploading image to Twitter, buffer size:', imageBuffer.length);

    // Upload media with timeout
    const mediaId = await Promise.race([
      client.v1.uploadMedia(imageBuffer, {
        mimeType: 'image/jpeg',
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Twitter media upload timeout')), 30000)
      )
    ]);

    console.log('Image uploaded to Twitter successfully:', mediaId);
    return mediaId;
  } catch (error) {
    console.error('Error uploading image to Twitter:', error);
    if (error instanceof Error && error.message === 'Twitter media upload timeout') {
      console.error('Twitter media upload timed out after 30 seconds');
    }
    return null;
  }
}

async function sendNewsToTwitter(newsData: any, imageBuffers?: Buffer[]): Promise<string | null> {
  try {
    const { TwitterApi } = require('twitter-api-v2');

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_KEY_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });

    // Check if credentials are properly configured
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
      console.log('Twitter credentials not properly configured');
      console.log('Missing credentials:', {
        TWITTER_API_KEY: !!process.env.TWITTER_API_KEY,
        TWITTER_API_KEY_SECRET: !!process.env.TWITTER_API_KEY_SECRET,
        TWITTER_ACCESS_TOKEN: !!process.env.TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_TOKEN_SECRET: !!process.env.TWITTER_ACCESS_TOKEN_SECRET,
      });
      return null;
    }

    // Upload images if present
    let mediaIds: string[] = [];
    if (imageBuffers && imageBuffers.length > 0) {
      for (let i = 0; i < Math.min(imageBuffers.length, 4); i++) { // Twitter allows max 4 images
        try {
          const mediaId = await uploadImageToTwitter(imageBuffers[i]);
          if (mediaId) {
            mediaIds.push(mediaId);
          } else {
            console.error(`Failed to upload image ${i + 1}/${imageBuffers.length} to Twitter`);
          }
        } catch (error) {
          console.error(`Error uploading image ${i + 1}/${imageBuffers.length} to Twitter:`, error);
        }
      }
    }

    // Prepare hashtags first (they should not be truncated)
    let hashtags = '';
    let hashtagLength = 0;
    if (newsData.hashtags) {
      // Split hashtags by comma and add # symbol to each
      const hashtagArray = newsData.hashtags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      const formattedHashtags = hashtagArray.map((tag: string) => tag.startsWith('#') ? tag : `#${tag}`).join(' ');
      hashtags = `\n\n${formattedHashtags}`;
      hashtagLength = hashtags.length;
    }

    // Prepare the news URL
    const baseUrl = process.env.FRONTEND_URL || 'https://yourdomain.com';
    const newsUrl = `${baseUrl}/news/${newsData.id}`;
    const linkText = `\n\nCheck out news: ${newsUrl}`;
    const linkLength = linkText.length;

    // Calculate available space for content (280 - hashtags - link - some buffer)
    const maxContentLength = 280 - hashtagLength - linkLength - 10; // 10 chars buffer for safety

    // Prepare tweet content with proper truncation
    let contentText = newsData.content;
    if (contentText.length > maxContentLength) {
      contentText = contentText.substring(0, maxContentLength - 3) + '...';
    }

    const tweetText = `${newsData.title}\n\n${contentText}`;
    const fullTweetText = `${tweetText}${hashtags}${linkText}`;

    // Final check to ensure we don't exceed 280 characters
    const maxLength = 280;
    const finalTweetText = fullTweetText.length > maxLength
      ? fullTweetText.substring(0, maxLength - 3) + '...'
      : fullTweetText;

    console.log('Tweet composition:', {
      title: newsData.title,
      contentLength: contentText.length,
      hashtagLength,
      linkLength,
      totalLength: finalTweetText.length,
      maxLength: 280,
      truncated: finalTweetText.length > 280
    });
    console.log('Attempting to post tweet:', finalTweetText);
    console.log('Media IDs:', mediaIds);

    // Create tweet with timeout
    const tweet = await Promise.race([
      client.v2.tweet(finalTweetText, {
        media: mediaIds.length > 0 ? { media_ids: mediaIds } : undefined,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Twitter API timeout')), 30000)
      )
    ]);

    console.log('News posted to Twitter successfully:', tweet.data.id);
    console.log('Full tweet response:', JSON.stringify(tweet, null, 2));
    return tweet.data.id;
  } catch (error) {
    console.error('Error posting to Twitter:', error);
    if (error instanceof Error) {
      console.error('Twitter API error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      if (error.message === 'Twitter API timeout') {
        console.error('Twitter API request timed out after 30 seconds');
      }
    }
    return null;
  }
}

async function editTwitterPost(twitterPostId: string, newsData: any, imageBuffers?: Buffer[]): Promise<void> {
  try {
    const { TwitterApi } = require('twitter-api-v2');

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_KEY_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });

    if (!twitterPostId) {
      console.log('Twitter post ID not configured');
      return;
    }

    // Twitter doesn't support editing tweets, so we delete and recreate
    await deleteFromTwitter(twitterPostId);
    await sendNewsToTwitter(newsData, imageBuffers);
  } catch (error) {
    console.error('Error editing Twitter post:', error);
  }
}

async function deleteFromTwitter(twitterPostId: string): Promise<void> {
  try {
    const { TwitterApi } = require('twitter-api-v2');

    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_KEY_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });

    if (!twitterPostId) {
      console.log('Twitter post ID not configured');
      return;
    }

    console.log(`Attempting to delete Twitter post: ${twitterPostId}`);

    // Check if credentials are properly configured
    if (!process.env.TWITTER_API_KEY || !process.env.TWITTER_API_KEY_SECRET ||
      !process.env.TWITTER_ACCESS_TOKEN || !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
      console.log('Twitter credentials not properly configured for deletion');
      return;
    }

    const result = await client.v2.deleteTweet(twitterPostId);
    console.log(`Deleted Twitter post successfully: ${twitterPostId}`, result);
  } catch (error) {
    console.error(`Error deleting Twitter post ${twitterPostId}:`, error);
    if (error instanceof Error) {
      console.error('Twitter deletion error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    // Don't throw error to avoid breaking the main deletion flow
  }
}

// Serve news image
const serveNewsImage = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { filename } = req.params;

    const filePath = path.join(process.cwd(), 'backend', 'uploads', 'news-images', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        message: 'Image not found',
        status: 'error',
        error: 'Not found',
        data: null,
      });
      return;
    }

    const stats = fs.statSync(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg'; // default

    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.jpg':
      case '.jpeg':
      default:
        contentType = 'image/jpeg';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to serve image',
      status: 'error',
      error: error instanceof Error ? error.message : error,
      data: null,
    });
    next(error);
  }
};

export default { get, getById, publicGetById, publicNews, create, update, remove, serveNewsImage };