
import { config } from 'dotenv';
import fs from 'fs';
import logger from './logger.config';

interface EnvConfig {
  APP_URL?: string;
  APP_NAME?: string;
  APP_PORT?: string;
  DIALECT?: string;
  DATABASE_HOST?: string;
  DATABASE_PORT?: string;
  DATABASE_USERNAME?: string;
  DATABASE_PASSWORD?: string;
  DATABASE_NAME?: string;
  LINKEDIN_ACCESS_TOKEN?: string;
  LINKEDIN_SUB?: string;
  LINKEDIN_API?: string;
  FRONTEND_URL?: string;
}

const envFile = `.env.${process.env.NODE_ENV || 'development'}.local`;

if (fs.existsSync(envFile)) {
  config({ path: envFile });
} else {
  logger.warn(`⚠️  Environment file ${envFile} not found. Make sure to run configureEnvironment.`);
}

console.log(`🔧 Environment loaded from ${envFile}`);

export const envConfig: EnvConfig = ({
  APP_URL: process.env.APP_URL,
  APP_NAME: process.env.APP_NAME,
  APP_PORT: process.env.APP_PORT,
  DIALECT: process.env.DIALECT,
  DATABASE_HOST: process.env.DATABASE_HOST,
  DATABASE_PORT: process.env.DATABASE_PORT,
  DATABASE_USERNAME: process.env.DATABASE_USERNAME,
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  DATABASE_NAME: process.env.DATABASE_NAME,
  LINKEDIN_ACCESS_TOKEN: process.env.LINKEDIN_ACCESS_TOKEN,
  LINKEDIN_SUB: process.env.LINKEDIN_SUB,
  LINKEDIN_API: process.env.LINKEDIN_API,
  FRONTEND_URL: process.env.FRONTEND_URL,
} = process.env as EnvConfig);
      