import { Router } from 'express';
import { refreshToken } from '../controllers/auth.controller';

const router = Router();

router.post('/refresh-token', refreshToken);

export default router;
