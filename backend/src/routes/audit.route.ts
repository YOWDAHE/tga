import { Router } from 'express';
import { getAuditLogs, getAuditLogById, getAuditLogsByTable } from '../controllers/audit.controller';

const auditRouter: Router = Router();

auditRouter.get('/', getAuditLogs);
auditRouter.get('/:id', getAuditLogById);
auditRouter.get('/table/:tableName', getAuditLogsByTable);

export default auditRouter; 