import { date } from 'drizzle-orm/mysql-core';
import { Request, Response, NextFunction, response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import { db } from '../db';
import { news } from '../db/schema';
import { v2 as cloudinary } from 'cloudinary';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: true });
const channelId = process.env.TELEGRAM_CHANNEL_ID!;

const mediaGroups = new Map<string, any[]>();

async function uploadTelegramPhoto(fileId: string): Promise<string> {
  const file = await bot.getFile(fileId);
  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const response = await fetch(fileUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  return await new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'news' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}

bot.on('channel_post', async (msg) => {
  try {
    if (msg.media_group_id) {
      const groupId = msg.media_group_id;
      if (!mediaGroups.has(groupId)) {
        mediaGroups.set(groupId, []);
        setTimeout(() => processMediaGroup(groupId), 1000);
      }
      mediaGroups.get(groupId)!.push(msg);
    } else {
      // Single message (may have photo)
      let visual_content: string[] | null = null;
      if (msg.photo && msg.photo.length > 0) {
        const bestPhoto = msg.photo[msg.photo.length - 1];
        const url = await uploadTelegramPhoto(bestPhoto.file_id);
        visual_content = [url];
      }
      await db.insert(news).values({
        title: msg.caption?.slice(0, 15).concat('...') || msg.text?.slice(0, 15).concat('...') || 'No title',
        content: msg.caption || msg.text || '',
        visual_content,
        source: 'Telegram',
        source_id: String(msg.message_id),
        message_id: String(msg.message_id),
        published_date: new Date(msg.date * 1000),
        created_by: 'telegram',
      });
    }
  } catch (error) {
    console.error('Error processing channel post:', error);
  }
});

async function processMediaGroup(groupId: string) {
  const messages: TelegramBot.Message[] = mediaGroups.get(groupId) || [];
  mediaGroups.delete(groupId);

  messages.sort((a, b) => a.message_id - b.message_id);

  const images: string[] = [];
  for (const msg of messages) {
    if (msg.photo && msg.photo.length > 0) {
      const bestPhoto = msg.photo[msg.photo.length - 1];
      const url = await uploadTelegramPhoto(bestPhoto.file_id);
      images.push(url);
    }
  }

  await db.insert(news).values({
    title: messages[0]?.caption?.slice(0, 15).concat('...') || 'No title',
    content: messages[0]?.caption || '',
    visual_content: images.length > 0 ? images : null,
    source: 'Telegram',
    message_id: String(messages[0]?.message_id),
    source_id: String(messages[0]?.message_id),
    published_date: new Date(messages[0]?.date * 1000),
    created_by: 'telegram',
  });
}



// Example REST endpoints (CRUD stubs)
const get = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ message: 'Fetched', status: 'success', error: null, data: [] });
  } catch (error) {
    next(error);
  }
};

const getById = async (req: Request, res: Response, next: NextFunction) => {
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
    const response = await bot.getChat(id);
    res.status(200).json({
      message: 'Message fetched',
      status: 'success',
      error: null,
      data: response,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Failed to fetch message',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    });
    next(error);
  }
};

const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({
        message: 'Message text is required',
        status: 'error',
        error: 'Missing message in request body',
        data: null,
      });
      return
    }

    const response = await bot.sendMessage(channelId, message);

    res.status(200).json({
      message: 'Message posted to channel',
      status: 'success',
      error: null,
      data: response,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error posting message to channel',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    });
    // Optionally: next(error);
  }
};

const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    const { id } = req.params;

    if (!message) {
      res.status(400).json({
        message: 'message are required',
        status: 'error',
        error: 'Missing message in request body',
        data: null,
      });
      return;
    }

    const response = await bot.editMessageText(message, {
      chat_id: channelId,
      message_id: Number(id),
    });

    res.status(200).json({
      message: 'Message updated successfully',
      status: 'success',
      error: null,
      data: response,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error updating message',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    });
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        message: 'id is required',
        status: 'error',
        error: 'Missing id in request body',
        data: null,
      });
      return;
    }

    const response = await bot.deleteMessage(channelId, Number(id));

    res.status(200).json({
      message: 'Message deleted successfully',
      status: 'success',
      error: null,
      data: response,
    });
  } catch (error) {
    res.status(400).json({
      message: 'Error deleting message',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    });
  }
};

export default { get, getById, create, update, remove };