import { generateTimeSlots } from '../src/utils/slots.utils';
import { config } from '../src/config';

describe('Time Slots Generation', () => {
  test('should generate correct number of slots', () => {
    const slots = generateTimeSlots();

    // From 12:00 to 20:00 with 30-minute slots = 16 slots
    // (12:00, 12:30, 13:00, ..., 19:30)
    const expectedSlots = ((config.businessHours.endHour - config.businessHours.startHour) * 60) / config.businessHours.slotDuration;

    expect(slots).toHaveLength(expectedSlots);
  });

  test('should start at correct time', () => {
    const slots = generateTimeSlots();
    const firstSlot = slots[0];

    expect(firstSlot).toBe('12:00');
  });

  test('should end before closing time', () => {
    const slots = generateTimeSlots();
    const lastSlot = slots[slots.length - 1];

    // Last slot should be 19:30 (30 minutes before 20:00)
    expect(lastSlot).toBe('19:30');
  });

  test('should have 30-minute intervals', () => {
    const slots = generateTimeSlots();

    // Check first few intervals
    expect(slots[0]).toBe('12:00');
    expect(slots[1]).toBe('12:30');
    expect(slots[2]).toBe('13:00');
    expect(slots[3]).toBe('13:30');
  });

  test('should format times with leading zeros', () => {
    const slots = generateTimeSlots();

    // All slots should match HH:MM format
    slots.forEach(slot => {
      expect(slot).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
