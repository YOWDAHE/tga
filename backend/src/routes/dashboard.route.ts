import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';

const dashboardRouter: Router = Router();

dashboardRouter.get('/', dashboardController.get);

export default dashboardRouter; 