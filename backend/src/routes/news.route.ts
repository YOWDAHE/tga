import { Router } from 'express';
import newsController from '../controllers/news.controller';

const newsRouter: Router = Router();

newsRouter.get('/', newsController.get);
newsRouter.get('/:id', newsController.getById);
newsRouter.post('/', newsController.create);
newsRouter.put('/:id', newsController.update);
newsRouter.delete('/:id', newsController.remove);

export default newsRouter;