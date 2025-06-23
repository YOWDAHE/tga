import { Router } from 'express';
import remarksController from '../controllers/remarks.controller';

const remarksRouter: Router = Router();

remarksRouter.get('/', remarksController.get);
remarksRouter.get('/:id', remarksController.getById);
remarksRouter.post('/', remarksController.create);
remarksRouter.post('/reply/:id', remarksController.reply);
remarksRouter.put('/:id', remarksController.update);
remarksRouter.delete('/:id', remarksController.remove);

export default remarksRouter;