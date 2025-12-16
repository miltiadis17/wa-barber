import { config } from '../config';
import { TimeSlot } from '../types';
import { BookingModel } from '../models/booking.model';
import { getCurrentDateBerlin, formatDate, formatTime } from './date.utils';

/**
 * Generate all possible time slots for a day
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const { startHour, endHour, slotDuration } = config.businessHours;

  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes < endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    slots.push(timeStr);
    currentMinutes += slotDuration;
  }

  return slots;
}

/**
 * Get available time slots for a specific master and date
 */
export async function getAvailableSlots(
  masterId: number,
  dateStr: string
): Promise<TimeSlot[]> {
  const allSlots = generateTimeSlots();
  const bookedSlots = await BookingModel.getBookedSlots(masterId, dateStr);
  const bookedTimesSet = new Set(bookedSlots.map(formatTime));

  // If the date is today, filter out past time slots
  const today = formatDate(getCurrentDateBerlin());
  const currentTime = getCurrentDateBerlin();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  return allSlots.map((time) => {
    let available = !bookedTimesSet.has(time);

    // Filter past slots if it's today
    if (available && dateStr === today) {
      const [slotHour, slotMinute] = time.split(':').map(Number);
      if (
        slotHour < currentHour ||
        (slotHour === currentHour && slotMinute <= currentMinute)
      ) {
        available = false;
      }
    }

    return { time, available };
  });
}

/**
 * Get only available time slots (not booked)
 */
export async function getOnlyAvailableSlots(
  masterId: number,
  dateStr: string
): Promise<string[]> {
  const slots = await getAvailableSlots(masterId, dateStr);
  return slots.filter((slot) => slot.available).map((slot) => slot.time);
}

/**
 * Check if a specific time slot is available
 */
export async function isSlotAvailable(
  masterId: number,
  dateStr: string,
  timeStr: string
): Promise<boolean> {
  const availableSlots = await getOnlyAvailableSlots(masterId, dateStr);
  return availableSlots.includes(timeStr);
}
