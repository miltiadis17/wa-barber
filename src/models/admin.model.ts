import { pool } from '../database/pool';
import { Admin } from '../types';

export class AdminModel {
  static async isAdmin(phone: string): Promise<boolean> {
    const result = await pool.query<Admin>(
      'SELECT * FROM admins WHERE phone = $1',
      [phone]
    );
    return result.rows.length > 0;
  }

  static async getAll(): Promise<Admin[]> {
    const result = await pool.query<Admin>(
      'SELECT * FROM admins ORDER BY created_at ASC'
    );
    return result.rows;
  }

  static async add(phone: string, name?: string): Promise<Admin> {
    const result = await pool.query<Admin>(
      `INSERT INTO admins (phone, name)
       VALUES ($1, $2)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [phone, name || null]
    );
    return result.rows[0];
  }
}
