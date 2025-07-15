import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { authenticateJWT, authorizePermissions } from '../middlewares/jwtAuth';

const categoryRouter: Router = Router();

categoryRouter.get('/', categoryController.get);
categoryRouter.get('/:id', authenticateJWT, authorizePermissions('CATEGORY_CRUD'), categoryController.getById);
categoryRouter.post('/', authenticateJWT, authorizePermissions('CATEGORY_CRUD'), categoryController.create);
categoryRouter.put('/:id', authenticateJWT, authorizePermissions('CATEGORY_CRUD'), categoryController.update);
categoryRouter.delete('/:id', authenticateJWT, authorizePermissions('CATEGORY_CRUD'), categoryController.remove);

export default categoryRouter;