import { UserModel, IUserDocument } from '../models/User.model';
import { IUser, IUserPublic } from '../types';
import { FilterQuery } from 'mongoose';

/** Repository abstraction — swap with DynamoDBUserRepository or FileUserRepository */
export class UserRepository {
  async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id);
  }

  async findByUserId(userId: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ userId });
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() });
  }

  async findAll(filter: FilterQuery<IUserDocument> = {}): Promise<IUserDocument[]> {
    return UserModel.find(filter).sort({ createdAt: -1 });
  }

  async create(data: Omit<IUser, '_id'>): Promise<IUserDocument> {
    return UserModel.create(data);
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async countAdmins(): Promise<number> {
    return UserModel.countDocuments({ role: 'admin', isActive: true });
  }

  async updateLastLogin(id: string): Promise<void> {
    await UserModel.findByIdAndUpdate(id, { $set: { lastLogin: new Date() } });
  }

  toPublic(user: IUserDocument): IUserPublic {
    return {
      _id: user._id.toString(),
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      accessLevel: user.accessLevel,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const userRepository = new UserRepository();
