import { Router } from 'express';
import { signUp, signIn } from '../controllers/auth.controller';

const authRouter = Router();

// Public routes
authRouter.post('/signup', signUp);
authRouter.post('/signin', signIn);

export default authRouter;
