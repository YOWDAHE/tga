import { Router } from 'express';
import newsController from '../controllers/news.controller';
import multer from 'multer';
import { authenticateJWT, authorizePermissions } from '../middlewares/jwtAuth';

const newsRouter: Router = Router();
const upload = multer();

newsRouter.get('/public', newsController.publicNews);
newsRouter.get('/public/:id', newsController.publicGetById);
newsRouter.get('/', newsController.get);
newsRouter.get('/:id', authenticateJWT, authorizePermissions('NEWS_CRUD'), newsController.getById);
newsRouter.post('/', authenticateJWT, authorizePermissions('NEWS_CRUD'), upload.array('visual_content', 10), newsController.create);
newsRouter.put('/:id', authenticateJWT, authorizePermissions('NEWS_CRUD'), upload.array('visual_content', 10), newsController.update);
newsRouter.delete('/:id', authenticateJWT, authorizePermissions('NEWS_CRUD'), newsController.remove);

export default newsRouter;