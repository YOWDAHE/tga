import { Router } from 'express';
import publicSearchController from '../controllers/public-search.controller.js';

const publicSearchRouter: Router = Router();

// Public search endpoint - no authentication required
publicSearchRouter.get('/news', publicSearchController.searchNews);

export default publicSearchRouter; 