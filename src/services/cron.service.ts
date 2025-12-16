import cron from 'node-cron';
import { BookingModel } from '../models/booking.model';
import { config } from '../config';

export class CronService {
  /**
   * Start all cron jobs
   */
  static start(): void {
    console.log('⏰ Starting cron jobs...');

    // Daily cleanup at 03:00 Europe/Berlin
    cron.schedule(
      config.cleanup.cronSchedule,
      async () => {
        console.log('🧹 Running daily cleanup job...');
        await this.cleanupOldBookings();
      },
      {
        timezone: config.businessHours.timezone,
      }
    );

    console.log(
      `✅ Cron jobs scheduled (timezone: ${config.businessHours.timezone})`
    );
  }

  /**
   * Clean up old bookings
   */
  private static async cleanupOldBookings(): Promise<void> {
    try {
      const deletedCount = await BookingModel.deleteOldBookings(
        config.cleanup.daysToKeep
      );

      console.log(
        `✅ Cleanup complete: ${deletedCount} old booking(s) deleted`
      );
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Run cleanup manually (for testing)
   */
  static async runCleanupNow(): Promise<number> {
    console.log('🧹 Running manual cleanup...');
    const deletedCount = await BookingModel.deleteOldBookings(
      config.cleanup.daysToKeep
    );
    console.log(`✅ Manual cleanup complete: ${deletedCount} booking(s) deleted`);
    return deletedCount;
  }
}
