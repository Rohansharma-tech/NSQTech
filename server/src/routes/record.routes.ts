import { Router } from 'express';
import { recordController } from '../controllers/record.controller';
import { authenticate } from '../middleware/auth.middleware';
import { delayMiddleware } from '../middleware/delay.middleware';

const router = Router();

router.get('/', authenticate, delayMiddleware, recordController.getRecords.bind(recordController));

export { router as recordRouter };
