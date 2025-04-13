import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authMiddleware = (allowedRoles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    try {
      // Verify token with Supabase auth API
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        console.error('Failed to verify token with Supabase:', error);
        res.status(401).json({ message: 'Invalid token' });
        return;
      }

      // Extract role from user_metadata - Supabase stores custom claims here
      const userRole = data.user.user_metadata?.role || '';

      req.user = {
        id: data.user.id,
        role: userRole,
      };

      console.log('Auth middleware - User:', req.user);

      // Check if user has required role
      const hasAccess = allowedRoles.includes(userRole.toLowerCase());
      if (!hasAccess) {
        res.status(403).json({ message: 'Access Denied' });
        return;
      }
    } catch (err) {
      console.error('Failed to verify token:', err);
      res.status(400).json({ message: 'Invalid token' });
      return;
    }

    next();
  };
};
