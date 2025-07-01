import cookieParser from 'cookie-parser';
import express, { Application } from 'express';
import helmet from 'helmet';
import {
  compressionMiddleware,
  corsMiddleware,
  errorMiddleware,
  limiterMiddleware,
  morganMiddleware,
} from '../middlewares/index';
import cors from 'cors';

const configureExpress = (): Application => {
  const app: Application = express();

  app.use(corsMiddleware);
  app.use(compressionMiddleware);
  app.use(morganMiddleware);
  app.use(helmet());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(cookieParser());
  app.use(limiterMiddleware);

  app.use(errorMiddleware);

  return app;
};

export default configureExpress;
