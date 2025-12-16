import { WhatsAppMessage } from '../types';
import { DialogModel } from '../models/dialog.model';
import { AdminModel } from '../models/admin.model';
import { BookingService } from './booking.service';
import { MyBookingsService } from './mybookings.service';
import { AdminService } from './admin.service';
import { WhatsAppService } from './whatsapp.service';

export class MessageHandlerService {
  static async handleMessage(message: WhatsAppMessage): Promise<void> {
    const phone = message.from;

    try {
      // Extract button/list reply IDs
      const buttonId = message.interactive?.button_reply?.id;
      const listId = message.interactive?.list_reply?.id;
      const textMessage = message.text?.body?.trim().toLowerCase();

      // Check if user is admin
      const isAdmin = await AdminModel.isAdmin(phone);

      // Get current dialog state
      const dialogState = await DialogModel.getState(phone);

      // Handle button clicks
      if (buttonId) {
        await this.handleButtonClick(phone, buttonId, isAdmin);
        return;
      }

      // Handle list selections
      if (listId) {
        await this.handleListSelection(phone, listId, dialogState?.state || 'idle');
        return;
      }

      // Handle text messages based on dialog state
      if (textMessage) {
        await this.handleTextMessage(phone, textMessage, isAdmin);
        return;
      }

      // Default: show main menu
      await BookingService.showMainMenu(phone);
    } catch (error) {
      console.error('Error handling message:', error);
      await WhatsAppService.sendText(
        phone,
        'An error occurred. Please try again.'
      );
      await BookingService.showMainMenu(phone);
    }
  }

  private static async handleButtonClick(
    phone: string,
    buttonId: string,
    isAdmin: boolean
  ): Promise<void> {
    const dialogState = await DialogModel.getState(phone);

    switch (buttonId) {
      case 'new_booking':
        await BookingService.startBooking(phone);
        break;

      case 'my_bookings':
        await MyBookingsService.showMyBookings(phone);
        break;

      case 'confirm_booking':
        await BookingService.confirmBooking(phone);
        break;

      case 'cancel_booking':
        await DialogModel.resetState(phone);
        await BookingService.showMainMenu(phone);
        break;

      case 'back_to_time':
        if (dialogState?.data.booking_date) {
          await BookingService.handleDateSelection(phone, dialogState.data.booking_date);
        }
        break;

      case 'cancel_this_booking':
        if (dialogState?.data.selected_booking_id) {
          await MyBookingsService.cancelBooking(phone, dialogState.data.selected_booking_id);
        }
        break;

      case 'back_to_bookings':
        await MyBookingsService.showMyBookings(phone);
        break;

      case 'main_menu':
        await BookingService.showMainMenu(phone);
        break;

      case 'admin_panel':
        if (isAdmin) {
          await AdminService.showAdminMenu(phone);
        }
        break;

      case 'admin_view_bookings':
        if (isAdmin) {
          await AdminService.showDateSelection(phone);
        }
        break;

      default:
        await BookingService.showMainMenu(phone);
        break;
    }
  }

  private static async handleListSelection(
    phone: string,
    listId: string,
    currentState: string
  ): Promise<void> {
    // Parse list item ID
    if (listId.startsWith('service_')) {
      const serviceId = parseInt(listId.replace('service_', ''), 10);
      await BookingService.handleServiceSelection(phone, serviceId);
    } else if (listId.startsWith('master_')) {
      const masterId = parseInt(listId.replace('master_', ''), 10);
      await BookingService.handleMasterSelection(phone, masterId);
    } else if (listId.startsWith('date_')) {
      const dateStr = listId.replace('date_', '');
      await BookingService.handleDateSelection(phone, dateStr);
    } else if (listId.startsWith('time_')) {
      const timeStr = listId.replace('time_', '');
      await BookingService.handleTimeSelection(phone, timeStr);
    } else if (listId.startsWith('booking_')) {
      const bookingId = parseInt(listId.replace('booking_', ''), 10);
      await MyBookingsService.showBookingDetails(phone, bookingId);
    } else if (listId.startsWith('admin_date_')) {
      const dateStr = listId.replace('admin_date_', '');
      await AdminService.showBookingsForDate(phone, dateStr);
    } else {
      await BookingService.showMainMenu(phone);
    }
  }

  private static async handleTextMessage(
    phone: string,
    text: string,
    isAdmin: boolean
  ): Promise<void> {
    // Handle common text commands
    if (text.includes('book') || text.includes('appointment') || text.includes('start')) {
      await BookingService.startBooking(phone);
    } else if (text.includes('my booking') || text.includes('my appointment')) {
      await MyBookingsService.showMyBookings(phone);
    } else if (text.includes('admin') && isAdmin) {
      await AdminService.showAdminMenu(phone);
    } else if (text.includes('help') || text.includes('menu')) {
      await BookingService.showMainMenu(phone);
    } else {
      // Default welcome message
      let welcomeMessage = 'Welcome to our Barbershop! 💈\n\n';
      welcomeMessage += 'I can help you:\n';
      welcomeMessage += '• Book an appointment\n';
      welcomeMessage += '• View your bookings\n';
      if (isAdmin) {
        welcomeMessage += '• Access admin panel\n';
      }

      await WhatsAppService.sendText(phone, welcomeMessage);

      const buttons = [
        { id: 'new_booking', title: '📅 Book Now' },
        { id: 'my_bookings', title: '📋 My Bookings' },
      ];

      if (isAdmin) {
        buttons.push({ id: 'admin_panel', title: '👨‍💼 Admin' });
      }

      await WhatsAppService.sendButtons(phone, 'What would you like to do?', buttons);
    }
  }
}
