import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { delayMiddleware } from '../middleware/delay.middleware';

const router = Router();

// All user management routes require admin role
router.use(authenticate, requireRole('admin'), delayMiddleware);

router.get('/', userController.getAll.bind(userController));
router.post('/', userController.create.bind(userController));
router.put('/:id', userController.update.bind(userController));
router.delete('/:id', userController.delete.bind(userController));
router.patch('/:id/toggle-status', userController.toggleStatus.bind(userController));

export { router as userRouter };
