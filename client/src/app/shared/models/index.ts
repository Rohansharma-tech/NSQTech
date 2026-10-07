export type UserRole = 'admin' | 'general';

export interface User {
  _id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  accessLevel: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Record {
  _id: string;
  recordId: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'pending' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  accessLevel: number;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecordFilter {
  category?: string;
  status?: string;
  priority?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  delay?: number;
}

export interface CreateUserRequest {
  userId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  accessLevel: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
  accessLevel?: number;
}
