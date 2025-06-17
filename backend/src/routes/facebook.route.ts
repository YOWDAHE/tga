import { Router } from 'express';
import facebookController from '../controllers/facebook.controller';

const facebookRouter: Router = Router();

facebookRouter.get('/', facebookController.get);
facebookRouter.get('/:id', facebookController.getById);
facebookRouter.post('/', facebookController.create);
facebookRouter.put('/:id', facebookController.update);
facebookRouter.delete('/:id', facebookController.remove);

export default facebookRouter;