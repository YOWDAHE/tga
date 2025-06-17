import { Router } from 'express';
import remarksController from '../controllers/remarks.controller.ts';

const remarksRouter: Router = Router();

remarksRouter.get('/', remarksController.get);
remarksRouter.get('/:id', remarksController.getById);
remarksRouter.post('/', remarksController.create);
remarksRouter.put('/:id', remarksController.update);
remarksRouter.delete('/:id', remarksController.remove);

export default remarksRouter;