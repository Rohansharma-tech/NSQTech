import { userRepository } from '../repositories/user.repository';
import { authService } from './auth.service';
import { IUserPublic, UserRole } from '../types';

export class UserService {
  async getAllUsers(): Promise<IUserPublic[]> {
    const users = await userRepository.findAll();
    return users.map((u) => userRepository.toPublic(u));
  }

  async getUserById(id: string): Promise<IUserPublic | null> {
    const user = await userRepository.findById(id);
    return user ? userRepository.toPublic(user) : null;
  }

  async createUser(data: {
    userId: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    accessLevel: number;
  }): Promise<IUserPublic> {
    const existing = await userRepository.findByUserId(data.userId);
    if (existing) {
      throw new Error('USER_ID_TAKEN');
    }

    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('EMAIL_TAKEN');
    }

    const hashedPassword = await authService.hashPassword(data.password);
    const user = await userRepository.create({ ...data, password: hashedPassword, isActive: true });
    return userRepository.toPublic(user);
  }

  async updateUser(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      password: string;
      role: UserRole;
      isActive: boolean;
      accessLevel: number;
    }>
  ): Promise<IUserPublic | null> {
    if (data.password) {
      data.password = await authService.hashPassword(data.password);
    }
    const user = await userRepository.updateById(id, data);
    return user ? userRepository.toPublic(user) : null;
  }

  async deleteUser(id: string, requestingUserId: string): Promise<void> {
    // Can't delete yourself
    const userToDelete = await userRepository.findById(id);
    if (!userToDelete) throw new Error('USER_NOT_FOUND');

    const requestingUser = await userRepository.findById(requestingUserId);
    if (!requestingUser) throw new Error('UNAUTHORIZED');

    if (userToDelete._id.toString() === requestingUserId) {
      throw new Error('CANNOT_DELETE_SELF');
    }

    // Can't remove the last admin
    if (userToDelete.role === 'admin') {
      const adminCount = await userRepository.countAdmins();
      if (adminCount <= 1) {
        throw new Error('LAST_ADMIN');
      }
    }

    await userRepository.deleteById(id);
  }

  async toggleUserStatus(id: string, requestingUserId: string): Promise<IUserPublic | null> {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('USER_NOT_FOUND');

    if (user._id.toString() === requestingUserId) {
      throw new Error('CANNOT_DEACTIVATE_SELF');
    }

    if (user.role === 'admin' && user.isActive) {
      const adminCount = await userRepository.countAdmins();
      if (adminCount <= 1) {
        throw new Error('LAST_ADMIN');
      }
    }

    const updated = await userRepository.updateById(id, { isActive: !user.isActive });
    return updated ? userRepository.toPublic(updated) : null;
  }
}

export const userService = new UserService();
