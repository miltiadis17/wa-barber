import { Request, Response } from 'express';
import { pool } from '../database/pool';
import { Service } from '../types';

export class AdminServicesController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await pool.query<Service>(
        'SELECT * FROM services ORDER BY id ASC'
      );
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching services:', error);
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query<Service>(
        'SELECT * FROM services WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching service:', error);
      res.status(500).json({ error: 'Failed to fetch service' });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, duration_minutes } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const result = await pool.query<Service>(
        'INSERT INTO services (name, duration_minutes) VALUES ($1, $2) RETURNING *',
        [name, duration_minutes ?? 30]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating service:', error);

      if (error.code === '23505') {
        res.status(409).json({ error: 'Service with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to create service' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, duration_minutes } = req.body;

      const result = await pool.query<Service>(
        `UPDATE services
         SET name = COALESCE($1, name),
             duration_minutes = COALESCE($2, duration_minutes)
         WHERE id = $3
         RETURNING *`,
        [name, duration_minutes, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating service:', error);

      if (error.code === '23505') {
        res.status(409).json({ error: 'Service with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Failed to update service' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if service has any bookings
      const bookingsCheck = await pool.query(
        'SELECT COUNT(*) as count FROM bookings WHERE service_id = $1',
        [id]
      );

      const hasBookings = parseInt(bookingsCheck.rows[0].count) > 0;

      if (hasBookings) {
        res.status(409).json({
          error: 'Cannot delete service with existing bookings',
          hasBookings: true,
        });
        return;
      }

      const result = await pool.query(
        'DELETE FROM services WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      res.json({ success: true, deleted: true, service: result.rows[0] });
    } catch (error) {
      console.error('Error deleting service:', error);
      res.status(500).json({ error: 'Failed to delete service' });
    }
  }
}
