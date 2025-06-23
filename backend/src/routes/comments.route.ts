import { Router } from 'express';
import commentsController from '../controllers/comments.controller.ts';

const commentsRouter: Router = Router();

commentsRouter.get('/', commentsController.get);
commentsRouter.get('/:id', commentsController.getById);
commentsRouter.post('/', commentsController.create);
commentsRouter.put('/:id', commentsController.update);
commentsRouter.delete('/:id', commentsController.remove);

export default commentsRouter;