import { Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const createUserSchema = z.object({
  userId: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, 'Only alphanumeric, _ and - allowed'),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'general']),
  accessLevel: z.number().int().min(1).max(5).default(1),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['admin', 'general']).optional(),
  isActive: z.boolean().optional(),
  accessLevel: z.number().int().min(1).max(5).optional(),
});

export class UserController {
  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.json({ success: true, data: users });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    try {
      const user = await userService.createUser(parsed.data);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'USER_ID_TAKEN') {
        res.status(409).json({ success: false, error: 'User ID already exists' });
      } else if (msg === 'EMAIL_TAKEN') {
        res.status(409).json({ success: false, error: 'Email already in use' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create user' });
      }
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation failed', details: parsed.error.errors });
      return;
    }

    try {
      const user = await userService.updateUser(req.params.id, parsed.data);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: user });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await userService.deleteUser(req.params.id, req.user!.sub);
      res.json({ success: true, message: 'User deleted' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'CANNOT_DELETE_SELF') {
        res.status(400).json({ success: false, error: 'You cannot delete your own account' });
      } else if (msg === 'LAST_ADMIN') {
        res.status(400).json({ success: false, error: 'Cannot remove the last admin' });
      } else if (msg === 'USER_NOT_FOUND') {
        res.status(404).json({ success: false, error: 'User not found' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to delete user' });
      }
    }
  }

  async toggleStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await userService.toggleUserStatus(req.params.id, req.user!.sub);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.json({ success: true, data: user });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'CANNOT_DEACTIVATE_SELF') {
        res.status(400).json({ success: false, error: 'You cannot deactivate your own account' });
      } else if (msg === 'LAST_ADMIN') {
        res.status(400).json({ success: false, error: 'Cannot deactivate the last admin' });
      } else {
        res.status(500).json({ success: false, error: 'Failed to update status' });
      }
    }
  }
}

export const userController = new UserController();
