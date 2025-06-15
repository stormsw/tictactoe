import { formatUserName, generateGameId, isValidEmail } from '../utils/helpers';

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
});
