import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { userRepository } from '../repositories/user.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['admin', 'general'], { required_error: 'Role is required' }),
});

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      // Generic error — don't reveal which field failed
      res.status(400).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    try {
      const { userId, password, role } = parsed.data;
      const result = await authService.login(userId, password, role);
      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message === 'ACCOUNT_DISABLED') {
        res.status(403).json({ success: false, error: 'Account is disabled' });
      } else {
        // Generic — don't reveal which field was wrong
        res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
    }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await userRepository.findById(req.user.sub);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, data: userRepository.toPublic(user) });
  }
}

export const authController = new AuthController();
