import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    adminAuthenticated?: boolean;
    adminUsername?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.adminAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
