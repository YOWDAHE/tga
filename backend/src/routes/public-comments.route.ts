import { Router } from 'express';
import commentsController from '../controllers/comments.controller.js';

const publicCommentsRouter: Router = Router();

publicCommentsRouter.get('/:news_id', commentsController.getByNewsId);
publicCommentsRouter.post('/', commentsController.create);
publicCommentsRouter.patch('/:id/toggle-like', commentsController.toggleLike);

export default publicCommentsRouter; 