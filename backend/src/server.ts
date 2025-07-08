import { envConfig } from './configs/env.config.js';
import next from 'next';
import configureExpress from './configs/express.config.js';
import uploadsRouter from './routes/uploads.route.js';
import categoryRouter from './routes/category.route.js';
import searchRouter from './routes/search.route.js';
import telegramRouter from './routes/telegram.route.js';
import newsRouter from './routes/news.route.js';
import landingRouter from './routes/landing.route.js';
import remarksRouter from './routes/remarks.route.js';
import contactRouter from './routes/contact.route.js';
import authRouter from './routes/auth.route.js';
import dashboardRouter from './routes/dashboard.route.js';
import { authenticateJWT, authorizePermissions } from './middlewares/jwtAuth.js';
import commentsRouter from './routes/comments.route.js';
import usersRouter from './routes/users.route.js';
import profileRouter from './routes/profile.route.js';
import auditRouter from './routes/audit.route.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const server = configureExpress();

app.prepare().then(() => {
  // Mount your API routes
  server.get('/', (req, res) => {
    res.send('Welcome to the API!');
  });
  server.use('/api/auth', authRouter);
  server.use('/api/uploads', authenticateJWT, authorizePermissions('ARCHIVES_CRUD'), uploadsRouter);
  server.use('/api/category', authenticateJWT, authorizePermissions('CATEGORY_CRUD'), categoryRouter);
  server.use('/api/search', searchRouter);
  server.use('/api/telegram', telegramRouter);
  server.use('/api/news', authenticateJWT, authorizePermissions('NEWS_CRUD'), newsRouter);
  server.use('/api/landing', authenticateJWT, authorizePermissions('HOMEPAGE_CRUD'), landingRouter);
  server.use('/api/remark', authenticateJWT, authorizePermissions('REMARKS_CRUD'), remarksRouter);
  server.use('/api/contact', authenticateJWT, authorizePermissions('HOMEPAGE_CRUD'), contactRouter);
  server.use('/api/comments', authenticateJWT, authorizePermissions('NEWS_CRUD'), commentsRouter);
  server.use('/api/users', authenticateJWT, authorizePermissions('USER_CRUD'), usersRouter);
  server.use('/api/profile', profileRouter);
  server.use('/api/audit-logs', authenticateJWT, authorizePermissions('USER_CRUD'), auditRouter);
  server.use('/api/dashboard', authenticateJWT, dashboardRouter);

  // Catch-all handler for Next.js pages
  server.all('*splat', (req, res) => {
    return handle(req, res);
  });

  const PORT = process.env.APP_PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode`);
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
