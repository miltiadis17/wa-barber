import { Request, Response } from 'express';
import { pool } from '../database/pool';

export class AdminStatsController {
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Total bookings
      const totalBookings = await pool.query(
        'SELECT COUNT(*) as count FROM bookings WHERE status = $1',
        ['confirmed']
      );

      // Bookings today
      const bookingsToday = await pool.query(
        `SELECT COUNT(*) as count FROM bookings
         WHERE booking_date = CURRENT_DATE AND status = $1`,
        ['confirmed']
      );

      // Upcoming bookings
      const upcomingBookings = await pool.query(
        `SELECT COUNT(*) as count FROM bookings
         WHERE booking_date >= CURRENT_DATE AND status = $1`,
        ['confirmed']
      );

      // Bookings by service
      const bookingsByService = await pool.query(
        `SELECT s.name, COUNT(b.id) as count
         FROM services s
         LEFT JOIN bookings b ON s.id = b.service_id AND b.status = 'confirmed'
         GROUP BY s.id, s.name
         ORDER BY count DESC`
      );

      // Bookings by master
      const bookingsByMaster = await pool.query(
        `SELECT m.name, COUNT(b.id) as count
         FROM masters m
         LEFT JOIN bookings b ON m.id = b.master_id AND b.status = 'confirmed'
         WHERE m.is_active = TRUE
         GROUP BY m.id, m.name
         ORDER BY count DESC`
      );

      // Bookings per day (last 7 days)
      const bookingsPerDay = await pool.query(
        `SELECT booking_date, COUNT(*) as count
         FROM bookings
         WHERE booking_date >= CURRENT_DATE - INTERVAL '6 days'
           AND booking_date <= CURRENT_DATE + INTERVAL '7 days'
           AND status = 'confirmed'
         GROUP BY booking_date
         ORDER BY booking_date ASC`
      );

      // Revenue stats (if price added later)
      const totalMasters = await pool.query(
        'SELECT COUNT(*) as count FROM masters WHERE is_active = TRUE'
      );

      const totalServices = await pool.query(
        'SELECT COUNT(*) as count FROM services'
      );

      // Busiest hours
      const busiestHours = await pool.query(
        `SELECT
           EXTRACT(HOUR FROM booking_time) as hour,
           COUNT(*) as count
         FROM bookings
         WHERE status = 'confirmed'
           AND booking_date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY hour
         ORDER BY count DESC
         LIMIT 5`
      );

      res.json({
        overview: {
          totalBookings: parseInt(totalBookings.rows[0].count),
          bookingsToday: parseInt(bookingsToday.rows[0].count),
          upcomingBookings: parseInt(upcomingBookings.rows[0].count),
          totalMasters: parseInt(totalMasters.rows[0].count),
          totalServices: parseInt(totalServices.rows[0].count),
        },
        bookingsByService: bookingsByService.rows,
        bookingsByMaster: bookingsByMaster.rows,
        bookingsPerDay: bookingsPerDay.rows,
        busiestHours: busiestHours.rows.map((row) => ({
          hour: `${row.hour}:00`,
          count: parseInt(row.count),
        })),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
}
