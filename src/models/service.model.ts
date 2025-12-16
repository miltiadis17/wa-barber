import { pool } from '../database/pool';
import { Service } from '../types';

export class ServiceModel {
  static async getAll(): Promise<Service[]> {
    const result = await pool.query<Service>(
      'SELECT * FROM services ORDER BY id ASC'
    );
    return result.rows;
  }

  static async getById(id: number): Promise<Service | null> {
    const result = await pool.query<Service>(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async getByName(name: string): Promise<Service | null> {
    const result = await pool.query<Service>(
      'SELECT * FROM services WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }
}
