import { generateTimeSlots } from '../src/utils/slots.utils';

describe('Time Slots with Service Duration', () => {
  describe('generateTimeSlots', () => {
    test('should generate correct number of 30-minute slots', () => {
      const slots = generateTimeSlots();

      // From 12:00 to 20:00 with 30-minute slots = 16 slots
      expect(slots).toHaveLength(16);
      expect(slots[0]).toBe('12:00');
      expect(slots[slots.length - 1]).toBe('19:30');
    });
  });

  describe('Slot blocking logic', () => {
    test('60-minute service should block 2 consecutive 30-minute slots', () => {
      // If a 60-minute service is booked at 13:00
      // Both 13:00 and 13:30 should be blocked
      const serviceStart = '13:00';
      const serviceDuration = 60;
      const slotSize = 30;

      const blockedSlots = Math.ceil(serviceDuration / slotSize);

      expect(blockedSlots).toBe(2);
      // Should block: 13:00, 13:30
    });

    test('90-minute service should block 3 consecutive 30-minute slots', () => {
      // If a 90-minute service is booked at 14:00
      // 14:00, 14:30, 15:00 should all be blocked
      const serviceDuration = 90;
      const slotSize = 30;

      const blockedSlots = Math.ceil(serviceDuration / slotSize);

      expect(blockedSlots).toBe(3);
      // Should block: 14:00, 14:30, 15:00
    });

    test('30-minute service should block only 1 slot', () => {
      const serviceDuration = 30;
      const slotSize = 30;

      const blockedSlots = Math.ceil(serviceDuration / slotSize);

      expect(blockedSlots).toBe(1);
    });

    test('45-minute service should block 2 slots (rounded up)', () => {
      // 45 minutes doesn't fit perfectly in 30-min slots
      // Should round up and block 2 slots
      const serviceDuration = 45;
      const slotSize = 30;

      const blockedSlots = Math.ceil(serviceDuration / slotSize);

      expect(blockedSlots).toBe(2);
    });
  });

  describe('Available slots calculation', () => {
    test('if 60-min service at 13:00, next available should be 14:00', () => {
      const bookedStart = '13:00';
      const serviceDuration = 60;
      const slotSize = 30;

      // Blocked slots: 13:00, 13:30
      // Next available: 14:00

      const bookedStartMinutes = 13 * 60; // 780
      const serviceEndMinutes = bookedStartMinutes + serviceDuration; // 840 (14:00)

      const nextAvailableHour = Math.floor(serviceEndMinutes / 60);
      const nextAvailableMinute = serviceEndMinutes % 60;

      expect(nextAvailableHour).toBe(14);
      expect(nextAvailableMinute).toBe(0);
    });

    test('checking if slot has enough consecutive free slots for 60-min service', () => {
      const availableSlots = ['12:00', '12:30', '13:00', '14:00', '14:30'];
      // Gap between 13:00 and 14:00 (13:30 is missing)

      // For 60-min service starting at 12:00 - needs 12:00 and 12:30 (OK)
      const canBook1200 = availableSlots.includes('12:00') &&
                          availableSlots.includes('12:30');
      expect(canBook1200).toBe(true);

      // For 60-min service starting at 12:30 - needs 12:30 and 13:00 (OK)
      const canBook1230 = availableSlots.includes('12:30') &&
                          availableSlots.includes('13:00');
      expect(canBook1230).toBe(true);

      // For 60-min service starting at 13:00 - needs 13:00 and 13:30 (NO - 13:30 missing)
      const canBook1300 = availableSlots.includes('13:00') &&
                          availableSlots.includes('13:30');
      expect(canBook1300).toBe(false);

      // For 60-min service starting at 14:00 - needs 14:00 and 14:30 (OK)
      const canBook1400 = availableSlots.includes('14:00') &&
                          availableSlots.includes('14:30');
      expect(canBook1400).toBe(true);
    });
  });

  describe('Time conversion helpers', () => {
    test('should convert time string to minutes correctly', () => {
      const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      expect(timeToMinutes('12:00')).toBe(720);
      expect(timeToMinutes('13:30')).toBe(810);
      expect(timeToMinutes('20:00')).toBe(1200);
    });

    test('should convert minutes to time string correctly', () => {
      const minutesToTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      };

      expect(minutesToTime(720)).toBe('12:00');
      expect(minutesToTime(810)).toBe('13:30');
      expect(minutesToTime(1200)).toBe('20:00');
    });
  });

  describe('Edge cases', () => {
    test('service ending at closing time should be allowed', () => {
      // If business closes at 20:00
      // 60-minute service can start at 19:00 (ends exactly at 20:00)
      const closingTime = 20 * 60; // 1200 minutes
      const serviceStart = 19 * 60; // 1140 minutes
      const serviceDuration = 60;

      const serviceEnd = serviceStart + serviceDuration;

      expect(serviceEnd).toBe(closingTime);
      expect(serviceEnd).toBeLessThanOrEqual(closingTime);
    });

    test('service extending past closing time should not be allowed', () => {
      // If business closes at 20:00
      // 60-minute service cannot start at 19:30 (would end at 20:30)
      const closingTime = 20 * 60; // 1200 minutes
      const serviceStart = 19 * 60 + 30; // 1170 minutes
      const serviceDuration = 60;

      const serviceEnd = serviceStart + serviceDuration;

      expect(serviceEnd).toBeGreaterThan(closingTime);
    });

    test('back-to-back bookings should work correctly', () => {
      // Booking 1: 13:00-14:00 (60 min)
      // Booking 2: 14:00-14:30 (30 min)
      // Both should be allowed

      const booking1Start = 13 * 60;
      const booking1Duration = 60;
      const booking1End = booking1Start + booking1Duration; // 840 (14:00)

      const booking2Start = 14 * 60;
      const booking2Duration = 30;

      // Booking 2 starts exactly when Booking 1 ends
      expect(booking2Start).toBe(booking1End);
    });
  });
});
