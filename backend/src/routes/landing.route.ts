import { Router } from 'express';
import multer from 'multer';
import landingController from '../controllers/landing.controller';

const landingRouter: Router = Router();
const upload = multer();

landingRouter.get('/', landingController.get);
landingRouter.post('/', landingController.create);
landingRouter.put('/', landingController.update);
landingRouter.delete('/:id', landingController.remove);
landingRouter.post('/upload', upload.single('file'), landingController.uploadImage);

export default landingRouter;