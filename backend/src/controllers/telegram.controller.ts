import { date } from 'drizzle-orm/mysql-core';
import { Request, Response, NextFunction } from 'express';
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(token, { polling: true });
const channelId = process.env.TELEGRAM_CHANNEL_ID!;

const mediaGroups = new Map<string, any[]>();

bot.on('channel_post', async (ctx) => {
  const msg = ctx;
  if (msg.media_group_id) {
    // Collect all messages in the same media group
    const groupId = msg.media_group_id;
    if (!mediaGroups.has(groupId)) {
      mediaGroups.set(groupId, []);
      // Wait for all images to arrive (Telegram sends them quickly)
      setTimeout(() => processMediaGroup(groupId), 1000);
    }
    mediaGroups.get(groupId)!.push(msg);
  } else {
    console.log('Received single message:', msg);
    return {
      caption: msg.caption || null,
      text: msg.text || null,
      images: msg.photo ? [msg.photo[msg.photo.length - 1].file_id] : [],
      date: msg.date ? new Date(msg.date * 1000) : new Date(),
      entities: msg.entities || [],
    }
  }
});

function processMediaGroup(groupId: string) {
  const messages = mediaGroups.get(groupId) || [];
  mediaGroups.delete(groupId);

  messages.sort((a, b) => a.message_id - b.message_id);

  const caption = messages[0]?.caption || 'No caption';
  const images = messages.map(msg => {
    // Get the highest resolution photo for each message
    const bestPhoto = msg.photo[msg.photo.length - 1];
    return bestPhoto.file_id;
  });

  console.log('Media group received:');
  console.log('Caption:', caption);
  console.log('Images:', images);

  return {
    caption,
    images,
    text: messages[0]?.text || null,
    entities: messages[0].entities || [],
    date: messages[0]?.date ? messages[0].date : new Date(),
  }

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
    res.status(200).json({ message: 'Fetched by id', status: 'success', error: null, data: null });
  } catch (error) {
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
    res.status(200).json({ message: 'Updated', status: 'success', error: null, data: null });
  } catch (error) {
    next(error);
  }
};

const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({ message: 'Removed', status: 'success', error: null, data: null });
  } catch (error) {
    next(error);
  }
};

export default { get, getById, create, update, remove };