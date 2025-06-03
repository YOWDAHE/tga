// backend/src/telegramBot.ts
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';

const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // Replace with your bot token
const bot = new TelegramBot(token, { polling: true });

// Initialize Express Router (optional)
const telegramRouter = express.Router();

telegramRouter.post('/webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

export { bot, telegramRouter };