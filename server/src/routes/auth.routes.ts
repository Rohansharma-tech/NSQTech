import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { delayMiddleware } from '../middleware/delay.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '10', 10),
  message: { success: false, error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, delayMiddleware, authController.login.bind(authController));
router.get('/me', authenticate, delayMiddleware, authController.me.bind(authController));

export { router as authRouter };
