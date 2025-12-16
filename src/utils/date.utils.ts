import { config } from '../config';

/**
 * Get current date in Europe/Berlin timezone
 */
export function getCurrentDateBerlin(): Date {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: config.businessHours.timezone })
  );
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to human-readable format
 */
export function formatDateHuman(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format time from HH:MM:SS to HH:MM
 */
export function formatTime(time: string): string {
  return time.substring(0, 5);
}

/**
 * Check if a date is a working day
 */
export function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return config.businessHours.workDays.includes(dayOfWeek);
}

/**
 * Get next N working days starting from tomorrow
 */
export function getAvailableDates(days: number): Date[] {
  const dates: Date[] = [];
  const currentDate = getCurrentDateBerlin();
  let checkDate = new Date(currentDate);
  checkDate.setDate(checkDate.getDate() + 1); // Start from tomorrow

  while (dates.length < days) {
    if (isWorkingDay(checkDate)) {
      dates.push(new Date(checkDate));
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return dates;
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/**
 * Check if date is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  const today = formatDate(getCurrentDateBerlin());
  return dateStr > today;
}
