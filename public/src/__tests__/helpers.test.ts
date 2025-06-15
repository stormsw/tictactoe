import { calculateWinRate, formatGameTime, formatPlayerStats, formatUserName, generateGameId, getUserDisplayName, isValidEmail, validateEmail } from '../utils/helpers';

describe('Helper Functions', () => {
  describe('formatUserName', () => {
    test('capitalizes first letter of username', () => {
      expect(formatUserName('john')).toBe('John');
      expect(formatUserName('MARY')).toBe('MARY');
      expect(formatUserName('alice')).toBe('Alice');
    });

    test('handles empty string', () => {
      expect(formatUserName('')).toBe('');
    });

    test('handles single character', () => {
      expect(formatUserName('a')).toBe('A');
      expect(formatUserName('z')).toBe('Z');
    });
  });

  describe('isValidEmail', () => {
    test('validates correct email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    });

    test('rejects invalid email format', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });

    test('handles edge cases', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(' ')).toBe(false);
      expect(isValidEmail('test.email@domain.com')).toBe(true);
    });
  });

  describe('generateGameId', () => {
    test('generates a string', () => {
      const gameId = generateGameId();
      expect(typeof gameId).toBe('string');
      expect(gameId.length).toBeGreaterThan(0);
    });

    test('generates unique IDs', () => {
      const id1 = generateGameId();
      const id2 = generateGameId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('calculateWinRate', () => {
    test('calculates win rate correctly', () => {
      expect(calculateWinRate(7, 10)).toBe(70);
      expect(calculateWinRate(3, 5)).toBe(60);
    });

    test('handles zero total games', () => {
      expect(calculateWinRate(0, 0)).toBe(0);
    });
  });

  describe('formatPlayerStats', () => {
    test('formats player stats correctly', () => {
      expect(formatPlayerStats(7, 2, 1)).toBe('7W-2L-1D (70%)');
      expect(formatPlayerStats(0, 0, 0)).toBe('0W-0L-0D (0%)');
    });
  });

  describe('validateEmail', () => {
    test('validates email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('formatGameTime', () => {
    test('formats timestamps to time', () => {
      const timestamp = '2023-01-01T14:30:00Z';
      const result = formatGameTime(timestamp);
      expect(typeof result).toBe('string');
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Should match time format
    });
  });

  describe('getUserDisplayName', () => {
    test('formats usernames properly', () => {
      expect(getUserDisplayName('john_doe')).toBe('John Doe');
      expect(getUserDisplayName('alice')).toBe('Alice');
      expect(getUserDisplayName('')).toBe('Guest');
      expect(getUserDisplayName('mary_jane_watson')).toBe('Mary Jane Watson');
    });
  });
});
