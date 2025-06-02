import { Router } from 'express';
import categoryController from '../controllers/category.controller';

const categoryRouter: Router = Router();

categoryRouter.get('/', categoryController.get);
categoryRouter.get('/:id', categoryController.getById);
categoryRouter.post('/', categoryController.create);
categoryRouter.put('/:id', categoryController.update);
categoryRouter.delete('/:id', categoryController.remove);

export default categoryRouter;