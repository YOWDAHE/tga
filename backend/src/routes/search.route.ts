import { Router } from 'express';
import searchController from '../controllers/search.controller';

const searchRouter: Router = Router();

searchRouter.get('/', searchController.get);

export default searchRouter;