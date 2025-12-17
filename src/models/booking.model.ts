import { pool } from '../database/pool';
import { Booking, BookingWithDetails } from '../types';

export class BookingModel {
  static async create(booking: {
    client_phone: string;
    client_name: string | null;
    service_id: number;
    master_id: number;
    booking_date: string;
    booking_time: string;
  }): Promise<Booking> {
    const result = await pool.query<Booking>(
      `INSERT INTO bookings (client_phone, client_name, service_id, master_id, booking_date, booking_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        booking.client_phone,
        booking.client_name,
        booking.service_id,
        booking.master_id,
        booking.booking_date,
        booking.booking_time,
      ]
    );
    return result.rows[0];
  }

  static async getByClientPhone(phone: string): Promise<BookingWithDetails[]> {
    const result = await pool.query<BookingWithDetails>(
      `SELECT b.*, s.name as service_name, m.name as master_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN masters m ON b.master_id = m.id
       WHERE b.client_phone = $1
         AND b.status = 'confirmed'
         AND (b.booking_date > CURRENT_DATE
              OR (b.booking_date = CURRENT_DATE AND b.booking_time >= CURRENT_TIME))
       ORDER BY b.booking_date ASC, b.booking_time ASC`,
      [phone]
    );
    return result.rows;
  }

  static async getById(id: number): Promise<BookingWithDetails | null> {
    const result = await pool.query<BookingWithDetails>(
      `SELECT b.*, s.name as service_name, m.name as master_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN masters m ON b.master_id = m.id
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async cancelBooking(id: number, clientPhone: string): Promise<boolean> {
    const result = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND client_phone = $2 AND status = 'confirmed'
       RETURNING id`,
      [id, clientPhone]
    );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async getBookedSlots(
    masterId: number,
    date: string
  ): Promise<string[]> {
    const result = await pool.query<{ booking_time: string }>(
      `SELECT booking_time
       FROM bookings
       WHERE master_id = $1
         AND booking_date = $2
         AND status = 'confirmed'
       ORDER BY booking_time ASC`,
      [masterId, date]
    );
    return result.rows.map((row) => row.booking_time);
  }

  static async getBookedSlotsWithDuration(
    masterId: number,
    date: string
  ): Promise<Array<{ booking_time: string; duration_minutes: number }>> {
    const result = await pool.query<{
      booking_time: string;
      duration_minutes: number;
    }>(
      `SELECT b.booking_time, s.duration_minutes
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.master_id = $1
         AND b.booking_date = $2
         AND b.status = 'confirmed'
       ORDER BY b.booking_time ASC`,
      [masterId, date]
    );
    return result.rows;
  }

  static async getBookingsByDate(date: string): Promise<BookingWithDetails[]> {
    const result = await pool.query<BookingWithDetails>(
      `SELECT b.*, s.name as service_name, m.name as master_name
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       JOIN masters m ON b.master_id = m.id
       WHERE b.booking_date = $1
         AND b.status = 'confirmed'
       ORDER BY b.booking_time ASC, m.name ASC`,
      [date]
    );
    return result.rows;
  }

  static async deleteOldBookings(daysToKeep: number): Promise<number> {
    const result = await pool.query(
      `DELETE FROM bookings
       WHERE booking_date < CURRENT_DATE - INTERVAL '1 day' * $1`,
      [daysToKeep]
    );
    return result.rowCount || 0;
  }
}
