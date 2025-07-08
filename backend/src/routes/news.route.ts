import { Router } from 'express';
import newsController from '../controllers/news.controller';
import multer from 'multer';

const newsRouter: Router = Router();
const upload = multer();

newsRouter.get('/', newsController.get);
newsRouter.get('/:id', newsController.getById);
newsRouter.post('/', upload.array('visual_content', 10), newsController.create);
newsRouter.put('/:id', upload.array('visual_content', 10), newsController.update);
newsRouter.delete('/:id', newsController.remove);

export default newsRouter;