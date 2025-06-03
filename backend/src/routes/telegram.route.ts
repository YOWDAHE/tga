import { Router } from 'express';
import telegramController from '../controllers/telegram.controller';

const telegramRouter: Router = Router();

telegramRouter.get('/', telegramController.get);
telegramRouter.get('/:id', telegramController.getById);
telegramRouter.post('/', telegramController.create);
telegramRouter.put('/:id', telegramController.update);
telegramRouter.delete('/:id', telegramController.remove);

export default telegramRouter;