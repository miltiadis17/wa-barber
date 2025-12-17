import { config } from '../config';
import { TimeSlot } from '../types';
import { BookingModel } from '../models/booking.model';
import { ServiceModel } from '../models/service.model';
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
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Get all time slots occupied by a booking (including duration)
 */
function getOccupiedSlots(startTime: string, durationMinutes: number): string[] {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  const slotDuration = config.businessHours.slotDuration;
  const occupiedSlots: string[] = [];

  for (let m = startMinutes; m < endMinutes; m += slotDuration) {
    occupiedSlots.push(minutesToTime(m));
  }

  return occupiedSlots;
}

/**
 * Get available time slots for a specific master and date
 * Now accounts for service duration - if a 60min service is booked at 13:00,
 * both 13:00 and 13:30 slots will be marked as unavailable
 */
export async function getAvailableSlots(
  masterId: number,
  dateStr: string
): Promise<TimeSlot[]> {
  const allSlots = generateTimeSlots();

  // Get bookings with their service durations
  const bookingsWithDuration = await BookingModel.getBookedSlotsWithDuration(
    masterId,
    dateStr
  );

  // Build set of all occupied time slots (accounting for duration)
  const occupiedTimesSet = new Set<string>();
  for (const booking of bookingsWithDuration) {
    const occupiedSlots = getOccupiedSlots(
      formatTime(booking.booking_time),
      booking.duration_minutes
    );
    occupiedSlots.forEach((slot) => occupiedTimesSet.add(slot));
  }

  // If the date is today, filter out past time slots
  const today = formatDate(getCurrentDateBerlin());
  const currentTime = getCurrentDateBerlin();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  return allSlots.map((time) => {
    let available = !occupiedTimesSet.has(time);

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
 * Get available slots across all masters (union of all available times)
 * Used when client selects "Any Available Master"
 */
async function getAvailableSlotsForAnyMaster(
  dateStr: string,
  serviceId?: number
): Promise<string[]> {
  const { MasterModel } = await import('../models/master.model');
  const allMasters = await MasterModel.getAll();

  // Collect all available slots from all masters
  const allAvailableSlots = new Set<string>();

  for (const master of allMasters) {
    const masterSlots = await getOnlyAvailableSlots(master.id, dateStr, serviceId);
    masterSlots.forEach((slot) => allAvailableSlots.add(slot));
  }

  // Convert to sorted array
  return Array.from(allAvailableSlots).sort();
}

/**
 * Get only available time slots for a service (accounting for service duration)
 * If service requires 60 minutes, only shows slots where 2 consecutive 30min slots are free
 * If masterId = 0, checks availability across all masters
 */
export async function getOnlyAvailableSlots(
  masterId: number,
  dateStr: string,
  serviceId?: number
): Promise<string[]> {
  // Special case: masterId = 0 means "any available master"
  if (masterId === 0) {
    return getAvailableSlotsForAnyMaster(dateStr, serviceId);
  }

  const allSlots = await getAvailableSlots(masterId, dateStr);
  const availableSlots = allSlots.filter((slot) => slot.available).map((slot) => slot.time);

  // If no service specified, return all available slots
  if (!serviceId) {
    return availableSlots;
  }

  // Get service duration
  const service = await ServiceModel.getById(serviceId);
  if (!service) {
    return availableSlots;
  }

  const serviceDuration = service.duration_minutes;
  const slotDuration = config.businessHours.slotDuration;
  const requiredSlots = Math.ceil(serviceDuration / slotDuration);

  // If service only needs 1 slot, return as is
  if (requiredSlots <= 1) {
    return availableSlots;
  }

  // Filter slots where we have enough consecutive available slots
  const availableForService: string[] = [];
  const availableSet = new Set(availableSlots);

  for (const slot of availableSlots) {
    const startMinutes = timeToMinutes(slot);
    let hasEnoughSlots = true;

    // Check if all required consecutive slots are available
    for (let i = 0; i < requiredSlots; i++) {
      const checkMinutes = startMinutes + i * slotDuration;
      const checkTime = minutesToTime(checkMinutes);

      if (!availableSet.has(checkTime)) {
        hasEnoughSlots = false;
        break;
      }

      // Also check if this slot would exceed business hours
      if (checkMinutes >= config.businessHours.endHour * 60) {
        hasEnoughSlots = false;
        break;
      }
    }

    if (hasEnoughSlots) {
      availableForService.push(slot);
    }
  }

  return availableForService;
}

/**
 * Check if a specific time slot is available for a service
 */
export async function isSlotAvailable(
  masterId: number,
  dateStr: string,
  timeStr: string,
  serviceId?: number
): Promise<boolean> {
  const availableSlots = await getOnlyAvailableSlots(masterId, dateStr, serviceId);
  return availableSlots.includes(timeStr);
}

/**
 * Find first available master for a specific time slot and service
 * Returns null if no master is available
 */
export async function findFirstAvailableMaster(
  dateStr: string,
  timeStr: string,
  serviceId: number
): Promise<number | null> {
  const { MasterModel } = await import('../models/master.model');
  const allMasters = await MasterModel.getAll();

  for (const master of allMasters) {
    const isAvailable = await isSlotAvailable(master.id, dateStr, timeStr, serviceId);
    if (isAvailable) {
      return master.id;
    }
  }

  return null;
}
