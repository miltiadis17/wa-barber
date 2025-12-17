import { Request, Response } from 'express';
import { pool } from '../database/pool';
import { Master } from '../types';

export class AdminMastersController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query<Master>(
        'SELECT * FROM masters ORDER BY id ASC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching masters:', error);
      res.status(500).json({ error: 'Failed to fetch masters' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query<Master>(
        'SELECT * FROM masters WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Master not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching master:', error);
      res.status(500).json({ error: 'Failed to fetch master' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, is_active } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const result = await pool.query<Master>(
        'INSERT INTO masters (name, is_active) VALUES ($1, $2) RETURNING *',
        [name, is_active ?? true]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating master:', error);

      if (error.code === '23505') {
        res.status(409).json({ error: 'Master with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to create master' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, is_active } = req.body;

      const result = await pool.query<Master>(
        `UPDATE masters
         SET name = COALESCE($1, name),
             is_active = COALESCE($2, is_active)
         WHERE id = $3
         RETURNING *`,
        [name, is_active, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Master not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating master:', error);

      if (error.code === '23505') {
        res.status(409).json({ error: 'Master with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to update master' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if master has any bookings
      const bookingsCheck = await pool.query(
        'SELECT COUNT(*) as count FROM bookings WHERE master_id = $1',
        [id]
      );

      const hasBookings = parseInt(bookingsCheck.rows[0].count) > 0;

      if (hasBookings) {
        // Deactivate instead of delete
        const result = await pool.query<Master>(
          'UPDATE masters SET is_active = FALSE WHERE id = $1 RETURNING *',
          [id]
        );

        res.json({
          success: true,
          deactivated: true,
          message: 'Master has bookings, deactivated instead of deleted',
          master: result.rows[0],
        });
        return;
      }

      const result = await pool.query(
        'DELETE FROM masters WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Master not found' });
        return;
      }

      res.json({ success: true, deleted: true, master: result.rows[0] });
    } catch (error) {
      console.error('Error deleting master:', error);
      res.status(500).json({ error: 'Failed to delete master' });
    }
  }
}
