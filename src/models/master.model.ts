import { pool } from '../database/pool';
import { Master } from '../types';

export class MasterModel {
  static async getAll(): Promise<Master[]> {
    const result = await pool.query<Master>(
      'SELECT * FROM masters WHERE is_active = TRUE ORDER BY id ASC'
    );
    return result.rows;
  }

  static async getById(id: number): Promise<Master | null> {
    const result = await pool.query<Master>(
      'SELECT * FROM masters WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async getByName(name: string): Promise<Master | null> {
    const result = await pool.query<Master>(
      'SELECT * FROM masters WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }
}
