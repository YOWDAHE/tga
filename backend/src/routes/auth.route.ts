import { Router } from 'express';
import { signUp, signIn, refreshToken, me } from '../controllers/auth.controller';

const authRouter = Router();

// Public routes
authRouter.post('/signup', signUp);
authRouter.post('/signin', signIn);
authRouter.post('/refresh-token', refreshToken);
authRouter.get('/me', me);

export default authRouter;
