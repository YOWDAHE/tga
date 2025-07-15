import { Router } from 'express';
import documentsController from '../controllers/documents.controller';

const publicDocumentsRouter: Router = Router();

// Public routes - no authentication required
publicDocumentsRouter.get('/', documentsController.getPublic);
publicDocumentsRouter.get('/top-viewed', documentsController.getTopViewedPublic);
publicDocumentsRouter.get('/:id', documentsController.getByIdPublic);

export default publicDocumentsRouter; 