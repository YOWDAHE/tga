import { Router } from 'express';
import commentsController from '../controllers/comments.controller';

const commentsRouter: Router = Router();

commentsRouter.get('/', commentsController.get);
commentsRouter.get('/:id', commentsController.getById);
commentsRouter.post('/', commentsController.create);
commentsRouter.put('/:id', commentsController.update);
commentsRouter.delete('/:id', commentsController.remove);
commentsRouter.patch('/:id/toggle-flag', commentsController.toggleFlag);
commentsRouter.patch('/:id/toggle-visibility', commentsController.toggleVisibility);

export default commentsRouter;