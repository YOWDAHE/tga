import { Router } from 'express';
import landingController from '../controllers/landing.controller';

const landingRouter: Router = Router();

landingRouter.get('/', landingController.get);
landingRouter.post('/', landingController.create);
landingRouter.put('/:id', landingController.update);
landingRouter.delete('/:id', landingController.remove);

export default landingRouter;