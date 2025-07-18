import { Router } from 'express';
import documentsController from '../controllers/documents.controller';
import { authenticateJWT, authorizePermissions } from '../middlewares/jwtAuth';
import uploadsController from '../controllers/uploads.controller';

const publicDocumentsRouter: Router = Router();

// Public routes - no authentication required
publicDocumentsRouter.get('/', documentsController.getPublic);
publicDocumentsRouter.get('/top-viewed', documentsController.getTopViewedPublic);
publicDocumentsRouter.get('/:id', documentsController.getByIdPublic);

// Protected routes - require API_USER permission
publicDocumentsRouter.patch('/:id/increment-download', authenticateJWT, authorizePermissions('API_USER'), uploadsController.incrementDownloadCount);
publicDocumentsRouter.patch('/:id/increment-view', authenticateJWT, authorizePermissions('API_USER'), uploadsController.incrementViewCount);
publicDocumentsRouter.get('/:id/download', authenticateJWT, authorizePermissions('API_USER'), uploadsController.downloadDocument);

export default publicDocumentsRouter; 