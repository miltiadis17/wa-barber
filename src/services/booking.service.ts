import { WhatsAppService } from './whatsapp.service';
import { ServiceModel } from '../models/service.model';
import { MasterModel } from '../models/master.model';
import { BookingModel } from '../models/booking.model';
import { DialogModel } from '../models/dialog.model';
import { AdminModel } from '../models/admin.model';
import { getAvailableDates, formatDate, formatDateHuman, formatTime } from '../utils/date.utils';
import { getOnlyAvailableSlots } from '../utils/slots.utils';
import { config } from '../config';

export class BookingService {
  /**
   * Start the booking flow - show service selection
   */
  static async startBooking(phone: string): Promise<void> {
    const services = await ServiceModel.getAll();

    await DialogModel.setState(phone, 'awaiting_service', {});

    const sections = [
      {
        title: 'Services',
        rows: services.map((service) => ({
          id: `service_${service.id}`,
          title: service.name,
          description: `${service.duration_minutes} minutes`,
        })),
      },
    ];

    await WhatsAppService.sendList(
      phone,
      'Welcome to our barbershop! 💈\nPlease select a service:',
      'View Services',
      sections,
      'Book Appointment'
    );
  }

  /**
   * Handle service selection and show master selection
   */
  static async handleServiceSelection(phone: string, serviceId: number): Promise<void> {
    const service = await ServiceModel.getById(serviceId);
    if (!service) {
      await WhatsAppService.sendText(phone, 'Service not found. Please try again.');
      return this.startBooking(phone);
    }

    await DialogModel.setState(phone, 'awaiting_master', { service_id: serviceId });

    const masters = await MasterModel.getAll();
    const sections = [
      {
        title: 'Our Masters',
        rows: masters.map((master) => ({
          id: `master_${master.id}`,
          title: master.name,
          description: 'Available',
        })),
      },
    ];

    await WhatsAppService.sendList(
      phone,
      `Great! You selected: *${service.name}*\nNow, please choose your master:`,
      'View Masters',
      sections
    );
  }

  /**
   * Handle master selection and show date selection
   */
  static async handleMasterSelection(phone: string, masterId: number): Promise<void> {
    const master = await MasterModel.getById(masterId);
    if (!master) {
      await WhatsAppService.sendText(phone, 'Master not found. Please try again.');
      return;
    }

    const dialogState = await DialogModel.getState(phone);
    if (!dialogState || !dialogState.data.service_id) {
      return this.startBooking(phone);
    }

    await DialogModel.setState(phone, 'awaiting_date', {
      ...dialogState.data,
      master_id: masterId,
    });

    const dates = getAvailableDates(config.businessHours.daysInAdvance);
    const sections = [
      {
        title: 'Available Dates',
        rows: dates.slice(0, 10).map((date) => ({
          id: `date_${formatDate(date)}`,
          title: formatDateHuman(formatDate(date)),
          description: formatDate(date),
        })),
      },
    ];

    await WhatsAppService.sendList(
      phone,
      `Perfect! Master *${master.name}* is ready.\nSelect a date:`,
      'View Dates',
      sections
    );
  }

  /**
   * Handle date selection and show time slots
   */
  static async handleDateSelection(phone: string, dateStr: string): Promise<void> {
    const dialogState = await DialogModel.getState(phone);
    if (!dialogState || !dialogState.data.master_id || !dialogState.data.service_id) {
      return this.startBooking(phone);
    }

    // Pass service_id to get slots accounting for service duration
    const availableSlots = await getOnlyAvailableSlots(
      dialogState.data.master_id,
      dateStr,
      dialogState.data.service_id
    );

    if (availableSlots.length === 0) {
      const service = await ServiceModel.getById(dialogState.data.service_id);
      await WhatsAppService.sendText(
        phone,
        `Sorry, no available ${service?.duration_minutes}-minute slots for this date. Please choose another date.`
      );
      return;
    }

    await DialogModel.setState(phone, 'awaiting_time', {
      ...dialogState.data,
      booking_date: dateStr,
    });

    // Split slots into chunks of 10 for list message limit
    const slots = availableSlots.slice(0, 10);
    const sections = [
      {
        title: 'Available Times',
        rows: slots.map((time) => ({
          id: `time_${time}`,
          title: time,
        })),
      },
    ];

    await WhatsAppService.sendList(
      phone,
      `Date: *${formatDateHuman(dateStr)}*\nSelect a time:`,
      'View Times',
      sections
    );
  }

  /**
   * Handle time selection and show confirmation
   */
  static async handleTimeSelection(phone: string, timeStr: string): Promise<void> {
    const dialogState = await DialogModel.getState(phone);
    if (
      !dialogState ||
      !dialogState.data.service_id ||
      !dialogState.data.master_id ||
      !dialogState.data.booking_date
    ) {
      return this.startBooking(phone);
    }

    await DialogModel.setState(phone, 'awaiting_confirmation', {
      ...dialogState.data,
      booking_time: timeStr,
    });

    const service = await ServiceModel.getById(dialogState.data.service_id);
    const master = await MasterModel.getById(dialogState.data.master_id);

    const summary = `
📋 *Booking Summary*

Service: ${service?.name}
Master: ${master?.name}
Date: ${formatDateHuman(dialogState.data.booking_date)}
Time: ${timeStr}

Please confirm your booking:
    `.trim();

    await WhatsAppService.sendButtons(phone, summary, [
      { id: 'confirm_booking', title: '✅ Confirm' },
      { id: 'cancel_booking', title: '❌ Cancel' },
      { id: 'back_to_time', title: '🔙 Back' },
    ]);
  }

  /**
   * Confirm and create the booking
   */
  static async confirmBooking(phone: string): Promise<void> {
    const dialogState = await DialogModel.getState(phone);
    if (
      !dialogState ||
      !dialogState.data.service_id ||
      !dialogState.data.master_id ||
      !dialogState.data.booking_date ||
      !dialogState.data.booking_time
    ) {
      await WhatsAppService.sendText(phone, 'Booking session expired. Please start again.');
      return this.startBooking(phone);
    }

    try {
      const booking = await BookingModel.create({
        client_phone: phone,
        client_name: dialogState.data.client_name || null,
        service_id: dialogState.data.service_id,
        master_id: dialogState.data.master_id,
        booking_date: dialogState.data.booking_date,
        booking_time: dialogState.data.booking_time,
      });

      const service = await ServiceModel.getById(booking.service_id);
      const master = await MasterModel.getById(booking.master_id);

      await DialogModel.resetState(phone);

      const confirmationMessage = `
✅ *Booking Confirmed!*

Booking ID: #${booking.id}
Service: ${service?.name}
Master: ${master?.name}
Date: ${formatDateHuman(booking.booking_date)}
Time: ${formatTime(booking.booking_time)}

See you soon! 💈
      `.trim();

      await WhatsAppService.sendText(phone, confirmationMessage);

      // Notify admins
      await this.notifyAdmins(booking.id);

      // Show main menu
      await this.showMainMenu(phone);
    } catch (error: any) {
      console.error('Error creating booking:', error);

      if (error.code === '23505') {
        // Unique constraint violation
        await WhatsAppService.sendText(
          phone,
          'Sorry, this time slot was just booked. Please choose another time.'
        );
        await this.handleDateSelection(phone, dialogState.data.booking_date);
      } else {
        await WhatsAppService.sendText(
          phone,
          'An error occurred. Please try again.'
        );
        await this.startBooking(phone);
      }
    }
  }

  /**
   * Show main menu with options
   */
  static async showMainMenu(phone: string): Promise<void> {
    await DialogModel.resetState(phone);

    await WhatsAppService.sendButtons(
      phone,
      'What would you like to do?',
      [
        { id: 'new_booking', title: '📅 New Booking' },
        { id: 'my_bookings', title: '📋 My Bookings' },
      ]
    );
  }

  /**
   * Notify admins about new booking
   */
  private static async notifyAdmins(bookingId: number): Promise<void> {
    try {
      const admins = await AdminModel.getAll();
      const booking = await BookingModel.getById(bookingId);

      if (!booking) return;

      const message = `
🔔 *New Booking*

Booking ID: #${booking.id}
Client: ${booking.client_phone}
Service: ${booking.service_name}
Master: ${booking.master_name}
Date: ${formatDateHuman(booking.booking_date)}
Time: ${formatTime(booking.booking_time)}
      `.trim();

      for (const admin of admins) {
        try {
          await WhatsAppService.sendText(admin.phone, message);
        } catch (error) {
          console.error(`Failed to notify admin ${admin.phone}:`, error);
        }
      }
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  }
}
