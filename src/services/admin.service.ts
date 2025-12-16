import { WhatsAppService } from './whatsapp.service';
import { BookingModel } from '../models/booking.model';
import { DialogModel } from '../models/dialog.model';
import { getAvailableDates, formatDate, formatDateHuman, formatTime } from '../utils/date.utils';
import { config } from '../config';

export class AdminService {
  /**
   * Show admin menu
   */
  static async showAdminMenu(phone: string): Promise<void> {
    await WhatsAppService.sendButtons(
      phone,
      '👨‍💼 *Admin Panel*\n\nWhat would you like to do?',
      [
        { id: 'admin_view_bookings', title: '📅 View Bookings' },
        { id: 'main_menu', title: '🏠 Main Menu' },
      ]
    );
  }

  /**
   * Show date selection for viewing bookings
   */
  static async showDateSelection(phone: string): Promise<void> {
    await DialogModel.setState(phone, 'admin_viewing', {});

    const dates = getAvailableDates(config.businessHours.daysInAdvance);

    const sections = [
      {
        title: 'Select Date',
        rows: dates.slice(0, 10).map((date) => ({
          id: `admin_date_${formatDate(date)}`,
          title: formatDateHuman(formatDate(date)),
          description: formatDate(date),
        })),
      },
    ];

    await WhatsAppService.sendList(
      phone,
      'Select a date to view bookings:',
      'View Dates',
      sections
    );
  }

  /**
   * Show bookings for a specific date
   */
  static async showBookingsForDate(phone: string, dateStr: string): Promise<void> {
    const bookings = await BookingModel.getBookingsByDate(dateStr);

    if (bookings.length === 0) {
      await WhatsAppService.sendText(
        phone,
        `No bookings found for ${formatDateHuman(dateStr)}.`
      );
      await this.showAdminMenu(phone);
      return;
    }

    await DialogModel.setState(phone, 'admin_viewing', {
      admin_view_date: dateStr,
    });

    let message = `📅 *Bookings for ${formatDateHuman(dateStr)}*\n\n`;

    bookings.forEach((booking, index) => {
      message += `${index + 1}. *${formatTime(booking.booking_time)}* - ${booking.master_name}\n`;
      message += `   Service: ${booking.service_name}\n`;
      message += `   Client: ${booking.client_phone}\n`;
      message += `   ID: #${booking.id}\n\n`;
    });

    message += `Total: ${bookings.length} booking(s)`;

    await WhatsAppService.sendText(phone, message);

    await WhatsAppService.sendButtons(phone, 'What would you like to do?', [
      { id: 'admin_view_bookings', title: '📅 Other Date' },
      { id: 'main_menu', title: '🏠 Main Menu' },
    ]);
  }
}
