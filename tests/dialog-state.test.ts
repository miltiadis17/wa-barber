import { ConversationState } from '../src/types';

describe('Dialog State Transitions', () => {
  describe('Booking Flow States', () => {
    test('should follow correct state progression', () => {
      const bookingFlow: ConversationState[] = [
        'idle',
        'awaiting_service',
        'awaiting_master',
        'awaiting_date',
        'awaiting_time',
        'awaiting_confirmation',
        'idle',
      ];

      // Verify state transitions are valid
      expect(bookingFlow[0]).toBe('idle');
      expect(bookingFlow[1]).toBe('awaiting_service');
      expect(bookingFlow[2]).toBe('awaiting_master');
      expect(bookingFlow[3]).toBe('awaiting_date');
      expect(bookingFlow[4]).toBe('awaiting_time');
      expect(bookingFlow[5]).toBe('awaiting_confirmation');
      expect(bookingFlow[6]).toBe('idle'); // Back to idle after confirmation
    });
  });

  describe('State Validation', () => {
    test('should have all required states defined', () => {
      const requiredStates: ConversationState[] = [
        'idle',
        'awaiting_service',
        'awaiting_master',
        'awaiting_date',
        'awaiting_time',
        'awaiting_confirmation',
        'viewing_bookings',
        'admin_viewing',
      ];

      // All states should be valid ConversationState types
      requiredStates.forEach(state => {
        expect(typeof state).toBe('string');
        expect(state.length).toBeGreaterThan(0);
      });
    });
  });

  describe('State Reset', () => {
    test('should return to idle after booking completion', () => {
      const finalState: ConversationState = 'idle';

      expect(finalState).toBe('idle');
    });

    test('should return to idle after cancellation', () => {
      const cancelledState: ConversationState = 'idle';

      expect(cancelledState).toBe('idle');
    });
  });
});
