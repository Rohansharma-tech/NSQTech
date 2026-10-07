import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { recordService } from '../services/record.service';
import { RecordFilter } from '../repositories/record.repository';

export class RecordController {
  async getRecords(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const filter: RecordFilter = {
      category: req.query.category as string | undefined,
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Clamp limit
    if (filter.limit && filter.limit > 100) filter.limit = 100;

    try {
      const result = await recordService.getRecords(filter, req.user.role);
      res.json({
        success: true,
        data: result.records,
        pagination: result.pagination,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch records' });
    }
  }
}

export const recordController = new RecordController();
