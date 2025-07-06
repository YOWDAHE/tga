import { Router } from 'express';
import contactController from '../controllers/contact.controller';

const contactRouter: Router = Router();

contactRouter.get('/', contactController.get);
contactRouter.get('/:id', contactController.getById);
contactRouter.post('/', contactController.create);
contactRouter.put('/:id', contactController.update);
contactRouter.delete('/:id', contactController.remove);

export default contactRouter; 