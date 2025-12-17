import { Request, Response } from 'express';
import { pool } from '../database/pool';
import { BookingWithDetails } from '../types';

export class AdminBookingsController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { date, master_id, client_phone, status } = req.query;

      let query = `
        SELECT b.*, s.name as service_name, m.name as master_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN masters m ON b.master_id = m.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 1;

      if (date) {
        query += ` AND b.booking_date = $${paramCount}`;
        params.push(date);
        paramCount++;
      }

      if (master_id) {
        query += ` AND b.master_id = $${paramCount}`;
        params.push(master_id);
        paramCount++;
      }

      if (client_phone) {
        query += ` AND b.client_phone LIKE $${paramCount}`;
        params.push(`%${client_phone}%`);
        paramCount++;
      }

      if (status) {
        query += ` AND b.status = $${paramCount}`;
        params.push(status);
        paramCount++;
      }

      query += ` ORDER BY b.booking_date DESC, b.booking_time DESC LIMIT 100`;

      const result = await pool.query<BookingWithDetails>(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query<BookingWithDetails>(
        `SELECT b.*, s.name as service_name, m.name as master_name
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         JOIN masters m ON b.master_id = m.id
         WHERE b.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({ error: 'Failed to fetch booking' });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { service_id, master_id, booking_date, booking_time, status, client_name } = req.body;

      const result = await pool.query(
        `UPDATE bookings
         SET service_id = COALESCE($1, service_id),
             master_id = COALESCE($2, master_id),
             booking_date = COALESCE($3, booking_date),
             booking_time = COALESCE($4, booking_time),
             status = COALESCE($5, status),
             client_name = COALESCE($6, client_name),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING *`,
        [service_id, master_id, booking_date, booking_time, status, client_name, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      res.json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating booking:', error);

      if (error.code === '23505') {
        res.status(409).json({ error: 'Time slot already booked' });
        return;
      }

      res.status(500).json({ error: 'Failed to update booking' });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        ['cancelled', id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      res.json({ success: true, booking: result.rows[0] });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  }
}
