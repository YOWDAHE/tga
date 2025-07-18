import { Router } from 'express';
import * as apiAuthController from '../controllers/api-auth.controller';
import { authenticateJWT } from '../middlewares/jwtAuth';

const apiAuthRouter = Router();

// Public auth endpoints
apiAuthRouter.post('/signup', apiAuthController.apiSignUp);
apiAuthRouter.post('/signin', apiAuthController.apiSignIn);
apiAuthRouter.post('/refresh', apiAuthController.apiRefreshToken);

// Protected endpoints (require authentication)
apiAuthRouter.get('/me', authenticateJWT, apiAuthController.apiMe);

export default apiAuthRouter; 