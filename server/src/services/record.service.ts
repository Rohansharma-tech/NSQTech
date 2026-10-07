import { recordRepository, RecordFilter } from '../repositories/record.repository';
import { IRecord, UserRole } from '../types';

export class RecordService {
  /** General users get accessLevel <= 2, admins get everything */
  getMaxAccessLevel(role: UserRole): number {
    return role === 'admin' ? 5 : 2;
  }

  async getRecords(filter: RecordFilter, role: UserRole) {
    const maxAccessLevel = this.getMaxAccessLevel(role);
    const { records, total } = await recordRepository.findAll(filter, maxAccessLevel);

    const page = filter.page || 1;
    const limit = filter.limit || 10;

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const recordService = new RecordService();
