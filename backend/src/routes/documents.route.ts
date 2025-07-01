import { Router } from 'express';
import documentsController from '../controllers/documents.controller';

const documentsRouter: Router = Router();

documentsRouter.get('/', documentsController.get);
documentsRouter.get('/:id', documentsController.getById);
// documentsRouter.post('/', documentsController.create);
documentsRouter.put('/:id', documentsController.update);
documentsRouter.delete('/:id', documentsController.remove);

export default documentsRouter;