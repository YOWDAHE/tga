import winston from 'winston';
import { format, transports } from 'winston';

const logFormat = format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${JSON.stringify(message)}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        logFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/audit.log' })
    ],
});

export default logger;