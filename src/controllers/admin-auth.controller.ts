import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export class AdminAuthController {
  static async login(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }

    const adminUsername = config.admin.username;
    const adminPasswordHash = config.admin.passwordHash;

    if (username !== adminUsername) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    req.session.adminAuthenticated = true;
    req.session.adminUsername = username;

    res.json({ success: true, username });
  }

  static async logout(req: Request, res: Response): Promise<void> {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to logout' });
        return;
      }
      res.json({ success: true });
    });
  }

  static async checkAuth(req: Request, res: Response): Promise<void> {
    if (req.session?.adminAuthenticated) {
      res.json({
        authenticated: true,
        username: req.session.adminUsername,
      });
    } else {
      res.json({ authenticated: false });
    }
  }
}
