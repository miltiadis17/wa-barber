import { getOnlyAvailableSlots, findFirstAvailableMaster } from '../src/utils/slots.utils';
import { BookingModel } from '../src/models/booking.model';
import { ServiceModel } from '../src/models/service.model';
import { MasterModel } from '../src/models/master.model';

// Mock the models
jest.mock('../src/models/booking.model');
jest.mock('../src/models/service.model');
jest.mock('../src/models/master.model');

describe('Any Available Master Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnlyAvailableSlots with masterId = 0', () => {
    test('should return union of available slots from all masters', async () => {
      // Mock masters
      (MasterModel.getAll as jest.Mock).mockResolvedValue([
        { id: 1, name: 'John' },
        { id: 2, name: 'Andrew' },
        { id: 3, name: 'Paul' },
      ]);

      // Mock service
      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Haircut',
        duration_minutes: 30,
      });

      // Mock bookings for each master
      // John: busy at 13:00
      // Andrew: busy at 14:00
      // Paul: busy at 15:00
      (BookingModel.getBookedSlotsWithDuration as jest.Mock).mockImplementation(
        (masterId: number) => {
          if (masterId === 1) {
            return Promise.resolve([{ booking_time: '13:00:00', duration_minutes: 30 }]);
          } else if (masterId === 2) {
            return Promise.resolve([{ booking_time: '14:00:00', duration_minutes: 30 }]);
          } else if (masterId === 3) {
            return Promise.resolve([{ booking_time: '15:00:00', duration_minutes: 30 }]);
          }
          return Promise.resolve([]);
        }
      );

      const slots = await getOnlyAvailableSlots(0, '2024-12-20', 1);

      // Logic: slot is shown if ANY master is available
      // 13:00 - John busy, but Andrew & Paul free -> AVAILABLE
      // 14:00 - Andrew busy, but John & Paul free -> AVAILABLE
      // 15:00 - Paul busy, but John & Andrew free -> AVAILABLE
      expect(slots).toContain('12:00');
      expect(slots).toContain('12:30');
      expect(slots).toContain('13:00'); // Andrew & Paul available
      expect(slots).toContain('13:30');
      expect(slots).toContain('14:00'); // John & Paul available
      expect(slots).toContain('14:30');
      expect(slots).toContain('15:00'); // John & Andrew available
      expect(slots).toContain('15:30');
    });

    test('should show slot if at least one master is available', async () => {
      // Mock 2 masters
      (MasterModel.getAll as jest.Mock).mockResolvedValue([
        { id: 1, name: 'John' },
        { id: 2, name: 'Andrew' },
      ]);

      // Mock service
      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Haircut',
        duration_minutes: 30,
      });

      // John busy at 13:00, Andrew free
      (BookingModel.getBookedSlotsWithDuration as jest.Mock).mockImplementation(
        (masterId: number) => {
          if (masterId === 1) {
            return Promise.resolve([{ booking_time: '13:00:00', duration_minutes: 30 }]);
          }
          return Promise.resolve([]);
        }
      );

      const slots = await getOnlyAvailableSlots(0, '2024-12-20', 1);

      // 13:00 should be available because Andrew is free
      expect(slots).toContain('13:00');
    });

    test('should hide slot only if ALL masters are busy', async () => {
      // Mock 2 masters
      (MasterModel.getAll as jest.Mock).mockResolvedValue([
        { id: 1, name: 'John' },
        { id: 2, name: 'Andrew' },
      ]);

      // Mock service
      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Haircut',
        duration_minutes: 30,
      });

      // Both busy at 13:00
      (BookingModel.getBookedSlotsWithDuration as jest.Mock).mockResolvedValue([
        { booking_time: '13:00:00', duration_minutes: 30 },
      ]);

      const slots = await getOnlyAvailableSlots(0, '2024-12-20', 1);

      // 13:00 should NOT be available (both masters busy)
      expect(slots).not.toContain('13:00');
      // Other slots should be available
      expect(slots).toContain('12:00');
      expect(slots).toContain('12:30');
      expect(slots).toContain('13:30');
    });
  });

  describe('findFirstAvailableMaster', () => {
    test('should return first master with available slot', async () => {
      // Mock masters
      (MasterModel.getAll as jest.Mock).mockResolvedValue([
        { id: 1, name: 'John' },
        { id: 2, name: 'Andrew' },
        { id: 3, name: 'Paul' },
      ]);

      // Mock service
      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Haircut',
        duration_minutes: 30,
      });

      // John busy, Andrew free, Paul free
      (BookingModel.getBookedSlotsWithDuration as jest.Mock).mockImplementation(
        (masterId: number) => {
          if (masterId === 1) {
            return Promise.resolve([{ booking_time: '13:00:00', duration_minutes: 30 }]);
          }
          return Promise.resolve([]);
        }
      );

      const masterId = await findFirstAvailableMaster('2024-12-20', '13:00', 1);

      // Should return Andrew (id=2) as he's the first available
      expect(masterId).toBe(2);
    });

    test('should return null if no master is available', async () => {
      // Mock masters
      (MasterModel.getAll as jest.Mock).mockResolvedValue([
        { id: 1, name: 'John' },
        { id: 2, name: 'Andrew' },
      ]);

      // Mock service
      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Haircut',
        duration_minutes: 30,
      });

      // All busy at 13:00
      (BookingModel.getBookedSlotsWithDuration as jest.Mock).mockResolvedValue([
        { booking_time: '13:00:00', duration_minutes: 30 },
      ]);

      const masterId = await findFirstAvailableMaster('2024-12-20', '13:00', 1);

      // Should return null (no one available)
      expect(masterId).toBeNull();
    });

    test('should respect service duration when finding available master', async () => {
      // Mock masters
      (MasterModel.getAll as jest.Mock).mockResolvedValue([
        { id: 1, name: 'John' },
        { id: 2, name: 'Andrew' },
      ]);

      // Mock 60-minute service
      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 2,
        name: 'Complex',
        duration_minutes: 60,
      });

      // John: busy at 13:30 (blocks him from 13:00-13:30 booking)
      // Andrew: free
      (BookingModel.getBookedSlotsWithDuration as jest.Mock).mockImplementation(
        (masterId: number) => {
          if (masterId === 1) {
            return Promise.resolve([{ booking_time: '13:30:00', duration_minutes: 30 }]);
          }
          return Promise.resolve([]);
        }
      );

      const masterId = await findFirstAvailableMaster('2024-12-20', '13:00', 2);

      // Should return Andrew (id=2) because John's 13:30 booking blocks 13:00-14:00 slot
      expect(masterId).toBe(2);
    });
  });

  describe('Edge cases', () => {
    test('should handle single master scenario', async () => {
      // Only one master
      (MasterModel.getAll as jest.Mock).mockResolvedValue([{ id: 1, name: 'John' }]);

      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Haircut',
        duration_minutes: 30,
      });

      (BookingModel.getBookedSlotsWithDuration as jest.Mock).mockResolvedValue([]);

      const slots = await getOnlyAvailableSlots(0, '2024-12-20', 1);

      // Should work same as querying that specific master
      expect(slots.length).toBeGreaterThan(0);
    });

    test('should handle no masters scenario', async () => {
      // No masters at all
      (MasterModel.getAll as jest.Mock).mockResolvedValue([]);

      (ServiceModel.getById as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Haircut',
        duration_minutes: 30,
      });

      const slots = await getOnlyAvailableSlots(0, '2024-12-20', 1);

      // Should return empty array
      expect(slots).toEqual([]);
    });
  });
});
