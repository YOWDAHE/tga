
import cors from 'cors';
import { CorsOptions } from 'cors';

const corsOptions: CorsOptions = {
  // origin: '*',
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
    