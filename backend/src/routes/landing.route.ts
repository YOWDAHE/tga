import { Router } from 'express';
import multer from 'multer';
import landingController from '../controllers/landing.controller';
import { authenticateJWT, authorizePermissions } from '../middlewares/jwtAuth';

const landingRouter: Router = Router();
const upload = multer();

landingRouter.get('/', landingController.get);
landingRouter.post('/', authenticateJWT, authorizePermissions('HOMEPAGE_CRUD'), landingController.create);
landingRouter.put('/', authenticateJWT, authorizePermissions('HOMEPAGE_CRUD'), landingController.update);
landingRouter.delete('/:id', authenticateJWT, authorizePermissions('HOMEPAGE_CRUD'), landingController.remove);
landingRouter.post('/upload', authenticateJWT, authorizePermissions('HOMEPAGE_CRUD'), upload.single('file'), landingController.uploadImage);
landingRouter.post('/upload-partner', authenticateJWT, authorizePermissions('HOMEPAGE_CRUD'), upload.single('file'), landingController.uploadPartnerImage);
landingRouter.get('/uploads/:folder/:filename', landingController.serveUploadedFile);

export default landingRouter;