import { Router } from 'express';
import usersController from '../controllers/users.controller';

const usersRouter: Router = Router();

usersRouter.get('/', usersController.get);
usersRouter.post('/', usersController.create);
usersRouter.get('/:id', usersController.getById);
usersRouter.put('/:id', usersController.update);
usersRouter.delete('/:id', usersController.remove);

export default usersRouter;