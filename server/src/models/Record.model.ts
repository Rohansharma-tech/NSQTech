import mongoose, { Schema, Document } from 'mongoose';
import { IRecord } from '../types';

export interface IRecordDocument extends Omit<IRecord, '_id'>, Document {}

const RecordSchema = new Schema<IRecordDocument>(
  {
    recordId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['HR', 'Finance', 'Operations', 'IT', 'Legal', 'Compliance'],
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'archived'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    accessLevel: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 5,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const RecordModel = mongoose.model<IRecordDocument>('Record', RecordSchema);
