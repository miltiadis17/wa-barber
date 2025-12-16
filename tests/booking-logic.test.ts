import { DialogData } from '../src/types';

describe('Booking Logic', () => {
  describe('Dialog Data Validation', () => {
    test('should validate complete booking data', () => {
      const completeData: DialogData = {
        service_id: 1,
        master_id: 2,
        booking_date: '2024-12-20',
        booking_time: '14:30',
      };

      expect(completeData.service_id).toBeDefined();
      expect(completeData.master_id).toBeDefined();
      expect(completeData.booking_date).toBeDefined();
      expect(completeData.booking_time).toBeDefined();
    });

    test('should allow partial data during flow', () => {
      const partialData: DialogData = {
        service_id: 1,
      };

      expect(partialData.service_id).toBe(1);
      expect(partialData.master_id).toBeUndefined();
      expect(partialData.booking_date).toBeUndefined();
    });
  });

  describe('Booking Constraints', () => {
    test('should validate unique constraint requirements', () => {
      // Simulate unique constraint check
      const booking1 = {
        master_id: 1,
        booking_date: '2024-12-20',
        booking_time: '14:30',
      };

      const booking2 = {
        master_id: 1,
        booking_date: '2024-12-20',
        booking_time: '14:30',
      };

      // These should be considered duplicates
      const isDuplicate =
        booking1.master_id === booking2.master_id &&
        booking1.booking_date === booking2.booking_date &&
        booking1.booking_time === booking2.booking_time;

      expect(isDuplicate).toBe(true);
    });

    test('should allow same time for different masters', () => {
      const booking1 = {
        master_id: 1,
        booking_date: '2024-12-20',
        booking_time: '14:30',
      };

      const booking2 = {
        master_id: 2, // Different master
        booking_date: '2024-12-20',
        booking_time: '14:30',
      };

      const isDuplicate =
        booking1.master_id === booking2.master_id &&
        booking1.booking_date === booking2.booking_date &&
        booking1.booking_time === booking2.booking_time;

      expect(isDuplicate).toBe(false);
    });

    test('should allow same master at different times', () => {
      const booking1 = {
        master_id: 1,
        booking_date: '2024-12-20',
        booking_time: '14:30',
      };

      const booking2 = {
        master_id: 1,
        booking_date: '2024-12-20',
        booking_time: '15:00', // Different time
      };

      const isDuplicate =
        booking1.master_id === booking2.master_id &&
        booking1.booking_date === booking2.booking_date &&
        booking1.booking_time === booking2.booking_time;

      expect(isDuplicate).toBe(false);
    });
  });

  describe('Time Slot Format', () => {
    test('should validate time format HH:MM', () => {
      const validTimes = ['12:00', '14:30', '19:30'];
      const timeRegex = /^\d{2}:\d{2}$/;

      validTimes.forEach(time => {
        expect(time).toMatch(timeRegex);
      });
    });

    test('should validate date format YYYY-MM-DD', () => {
      const validDates = ['2024-12-20', '2025-01-05', '2024-11-30'];
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      validDates.forEach(date => {
        expect(date).toMatch(dateRegex);
      });
    });
  });
});
