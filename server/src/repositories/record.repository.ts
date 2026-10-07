import { RecordModel, IRecordDocument } from '../models/Record.model';
import { IRecord } from '../types';
import { FilterQuery } from 'mongoose';

export interface RecordFilter {
  category?: string;
  status?: string;
  priority?: string;
  accessLevel?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/** Repository abstraction — swap with DynamoDBRecordRepository if needed */
export class RecordRepository {
  async findAll(
    filter: RecordFilter = {},
    maxAccessLevel: number = 5
  ): Promise<{ records: IRecordDocument[]; total: number }> {
    const query: FilterQuery<IRecordDocument> = {
      accessLevel: { $lte: maxAccessLevel },
    };

    if (filter.category) query.category = filter.category;
    if (filter.status) query.status = filter.status;
    if (filter.priority) query.priority = filter.priority;
    if (filter.search) {
      query.$or = [
        { title: { $regex: filter.search, $options: 'i' } },
        { description: { $regex: filter.search, $options: 'i' } },
        { recordId: { $regex: filter.search, $options: 'i' } },
      ];
    }

    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const sortField = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;

    const [records, total] = await Promise.all([
      RecordModel.find(query)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit),
      RecordModel.countDocuments(query),
    ]);

    return { records, total };
  }

  async create(data: Omit<IRecord, '_id'>): Promise<IRecordDocument> {
    return RecordModel.create(data);
  }
}

export const recordRepository = new RecordRepository();
