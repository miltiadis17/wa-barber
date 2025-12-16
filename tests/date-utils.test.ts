import { formatDate, formatTime, isWorkingDay, getAvailableDates } from '../src/utils/date.utils';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    test('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-12-16T10:30:00');
      const formatted = formatDate(date);

      expect(formatted).toBe('2024-12-16');
    });

    test('should pad single-digit months and days', () => {
      const date = new Date('2024-01-05T10:30:00');
      const formatted = formatDate(date);

      expect(formatted).toBe('2024-01-05');
    });
  });

  describe('formatTime', () => {
    test('should format time from HH:MM:SS to HH:MM', () => {
      const time = '14:30:00';
      const formatted = formatTime(time);

      expect(formatted).toBe('14:30');
    });

    test('should handle time without seconds', () => {
      const time = '09:15';
      const formatted = formatTime(time);

      expect(formatted).toBe('09:15');
    });
  });

  describe('isWorkingDay', () => {
    test('should return true for Monday', () => {
      // 2024-12-16 is Monday
      const monday = new Date('2024-12-16T10:00:00');
      expect(isWorkingDay(monday)).toBe(true);
    });

    test('should return true for Saturday', () => {
      // 2024-12-21 is Saturday
      const saturday = new Date('2024-12-21T10:00:00');
      expect(isWorkingDay(saturday)).toBe(true);
    });

    test('should return false for Sunday', () => {
      // 2024-12-15 is Sunday
      const sunday = new Date('2024-12-15T10:00:00');
      expect(isWorkingDay(sunday)).toBe(false);
    });
  });

  describe('getAvailableDates', () => {
    test('should return correct number of working days', () => {
      const dates = getAvailableDates(5);

      expect(dates).toHaveLength(5);
    });

    test('should skip Sundays', () => {
      const dates = getAvailableDates(10);

      // None should be Sunday (day 0)
      dates.forEach(date => {
        expect(date.getDay()).not.toBe(0);
      });
    });

    test('should return dates in the future', () => {
      const dates = getAvailableDates(5);
      const today = new Date();

      dates.forEach(date => {
        expect(date.getTime()).toBeGreaterThan(today.getTime());
      });
    });
  });
});
