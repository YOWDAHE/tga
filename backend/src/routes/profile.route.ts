import { Router } from 'express';
import usersController from '../controllers/users.controller';
import { authenticateJWT } from '../middlewares/jwtAuth';

const profileRouter: Router = Router();

// Profile management routes - only require authentication, not USER_CRUD permission
profileRouter.get('/', authenticateJWT, usersController.getProfile);
profileRouter.put('/', authenticateJWT, usersController.updateProfile);
profileRouter.put('/password', authenticateJWT, usersController.changePassword);

export default profileRouter; 