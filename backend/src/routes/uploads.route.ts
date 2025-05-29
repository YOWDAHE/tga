import { Router } from 'express';
import multer from 'multer';
import uploadsController from '../controllers/uploads.controller';

const uploadsRouter: Router = Router();
const upload = multer();

uploadsRouter.get('/', uploadsController.get);
uploadsRouter.get('/:id', uploadsController.getById);
uploadsRouter.post('/', upload.single('file'), uploadsController.create);
uploadsRouter.put('/:id', uploadsController.update);
uploadsRouter.delete('/:id', uploadsController.remove);

export default uploadsRouter;