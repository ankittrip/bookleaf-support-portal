import type { Request } from 'express';
import type { UserRole } from '../../modules/users/schemas/user.schema.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  authorId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}