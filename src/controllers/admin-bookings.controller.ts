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

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { service_id, master_id, booking_date, booking_time, client_phone, client_name } = req.body;

      // Validate required fields
      if (!service_id || !master_id || !booking_date || !booking_time || !client_phone) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO bookings (service_id, master_id, booking_date, booking_time, client_phone, client_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'confirmed')
         RETURNING *`,
        [service_id, master_id, booking_date, booking_time, client_phone, client_name || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error creating booking:', error);

      if (error.code === '23505') {
        res.status(409).json({ error: 'Time slot already booked' });
        return;
      }

      res.status(500).json({ error: 'Failed to create booking' });
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

  static async getCalendarEvents(req: Request, res: Response): Promise<void> {
    try {
      const { start, end, master_id } = req.query;

      let query = `
        SELECT
          b.id,
          b.booking_date,
          b.booking_time,
          b.status,
          b.client_phone,
          b.client_name,
          s.name as service_name,
          s.duration_minutes,
          m.name as master_name,
          m.id as master_id
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN masters m ON b.master_id = m.id
        WHERE b.status != 'cancelled'
      `;
      const params: any[] = [];
      let paramCount = 1;

      if (start) {
        query += ` AND b.booking_date >= $${paramCount}`;
        params.push(start);
        paramCount++;
      }

      if (end) {
        query += ` AND b.booking_date <= $${paramCount}`;
        params.push(end);
        paramCount++;
      }

      if (master_id) {
        query += ` AND b.master_id = $${paramCount}`;
        params.push(master_id);
        paramCount++;
      }

      query += ` ORDER BY b.booking_date, b.booking_time`;

      const result = await pool.query(query, params);

      // Transform to FullCalendar format
      const events = result.rows.map((booking: any) => {
        const [hours, minutes] = booking.booking_time.split(':');
        const startDateTime = new Date(booking.booking_date);
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + booking.duration_minutes);

        // Color coding by master
        const colors: { [key: number]: string } = {
          1: '#3B82F6', // blue
          2: '#10B981', // green
          3: '#F59E0B', // amber
        };

        return {
          id: booking.id,
          title: `${booking.service_name} - ${booking.master_name}`,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          backgroundColor: colors[booking.master_id] || '#6B7280',
          borderColor: colors[booking.master_id] || '#6B7280',
          extendedProps: {
            client_phone: booking.client_phone,
            client_name: booking.client_name,
            master_name: booking.master_name,
            service_name: booking.service_name,
            status: booking.status,
            duration: booking.duration_minutes,
          },
        };
      });

      res.json(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  }
}
