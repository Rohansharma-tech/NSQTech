import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { JwtPayload, UserRole } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthService {
  async login(
    userId: string,
    password: string,
    role: UserRole
  ): Promise<{ token: string; user: ReturnType<typeof userRepository.toPublic> }> {
    const user = await userRepository.findByUserId(userId);

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new Error('ACCOUNT_DISABLED');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Role mismatch check — do NOT reveal which was wrong
    if (user.role !== role) {
      throw new Error('INVALID_CREDENTIALS');
    }

    await userRepository.updateLastLogin(user._id.toString());
    user.lastLogin = new Date();

    const payload: JwtPayload = {
      sub: user._id.toString(),
      userId: user.userId,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return { token, user: userRepository.toPublic(user) };
  }

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}

export const authService = new AuthService();
