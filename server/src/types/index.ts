export type UserRole = 'admin' | 'general';

export interface IUser {
  _id?: string;
  userId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  accessLevel: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserPublic {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  accessLevel: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRecord {
  _id?: string;
  recordId: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'pending' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  accessLevel: number;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JwtPayload {
  sub: string;
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
