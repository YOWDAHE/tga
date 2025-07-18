import { Router } from 'express';
import commentsController from '../controllers/comments.controller.js';
import { authenticateJWT, authorizePermissions } from '../middlewares/jwtAuth.js';

const publicCommentsRouter: Router = Router();

publicCommentsRouter.get('/:news_id', commentsController.getByNewsId);
publicCommentsRouter.post('/', authenticateJWT, authorizePermissions('API_USER'), commentsController.create);
publicCommentsRouter.patch('/:id/toggle-like', authenticateJWT, authorizePermissions('API_USER'), commentsController.toggleLike);
publicCommentsRouter.put('/:id', authenticateJWT, authorizePermissions('API_USER'), commentsController.editOwnComment);
publicCommentsRouter.delete('/:id', authenticateJWT, authorizePermissions('API_USER'), commentsController.removeOwnComment);

export default publicCommentsRouter; 
// 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