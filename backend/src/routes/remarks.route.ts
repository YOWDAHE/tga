import { Router } from 'express';
import remarksController from '../controllers/remarks.controller';
import { authenticateJWT, authorizePermissions } from '../middlewares/jwtAuth';

const remarksRouter: Router = Router();

remarksRouter.get('/', authenticateJWT, authorizePermissions('REMARKS_CRUD'), remarksController.get);
remarksRouter.get('/:id', authenticateJWT, authorizePermissions('REMARKS_CRUD'), remarksController.getById);
remarksRouter.post('/', remarksController.create);
remarksRouter.post('/reply/:id', authenticateJWT, authorizePermissions('REMARKS_CRUD'), remarksController.reply);
remarksRouter.put('/:id', authenticateJWT, authorizePermissions('REMARKS_CRUD'), remarksController.update);
remarksRouter.delete('/:id', authenticateJWT, authorizePermissions('REMARKS_CRUD'), remarksController.remove);

export default remarksRouter;