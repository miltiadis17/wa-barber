import { WhatsAppService } from './whatsapp.service';
import { BookingModel } from '../models/booking.model';
import { DialogModel } from '../models/dialog.model';
import { formatDateHuman, formatTime } from '../utils/date.utils';

export class MyBookingsService {
  /**
   * Show user's bookings
   */
  static async showMyBookings(phone: string): Promise<void> {
    const bookings = await BookingModel.getByClientPhone(phone);

    if (bookings.length === 0) {
      await WhatsAppService.sendText(
        phone,
        'You have no upcoming bookings.'
      );
      await DialogModel.resetState(phone);
      return;
    }

    await DialogModel.setState(phone, 'viewing_bookings', {});

    const sections = [
      {
        title: 'Your Bookings',
        rows: bookings.map((booking) => ({
          id: `booking_${booking.id}`,
          title: `${formatDateHuman(booking.booking_date)} at ${formatTime(booking.booking_time)}`,
          description: `${booking.service_name} with ${booking.master_name}`,
        })),
      },
    ];

    await WhatsAppService.sendList(
      phone,
      'Here are your upcoming bookings.\nSelect one to view details or cancel:',
      'View Bookings',
      sections
    );
  }

  /**
   * Show booking details with cancel option
   */
  static async showBookingDetails(phone: string, bookingId: number): Promise<void> {
    const booking = await BookingModel.getById(bookingId);

    if (!booking || booking.client_phone !== phone) {
      await WhatsAppService.sendText(phone, 'Booking not found.');
      return this.showMyBookings(phone);
    }

    await DialogModel.setState(phone, 'viewing_bookings', {
      selected_booking_id: bookingId,
    });

    const details = `
📋 *Booking Details*

Booking ID: #${booking.id}
Service: ${booking.service_name}
Master: ${booking.master_name}
Date: ${formatDateHuman(booking.booking_date)}
Time: ${formatTime(booking.booking_time)}
Status: ${booking.status}

What would you like to do?
    `.trim();

    await WhatsAppService.sendButtons(phone, details, [
      { id: 'cancel_this_booking', title: '❌ Cancel Booking' },
      { id: 'back_to_bookings', title: '🔙 Back' },
      { id: 'main_menu', title: '🏠 Main Menu' },
    ]);
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(phone: string, bookingId: number): Promise<void> {
    const success = await BookingModel.cancelBooking(bookingId, phone);

    if (success) {
      await WhatsAppService.sendText(
        phone,
        '✅ Booking cancelled successfully.'
      );
    } else {
      await WhatsAppService.sendText(
        phone,
        '❌ Failed to cancel booking. It may have already been cancelled.'
      );
    }

    await DialogModel.resetState(phone);
    await this.showMyBookings(phone);
  }
}
