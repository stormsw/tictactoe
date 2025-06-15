import { describe, expect, test } from 'vitest';
import { formatGameTime, getUserDisplayName, validateEmail } from '../utils/helpers';

describe('Additional Helper Functions', () => {
    test('validateEmail validates email format correctly', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user@domain.co.uk')).toBe(true);
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('user@')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('')).toBe(false);
    });

    test('formatGameTime formats time correctly', () => {
        const mockDate = new Date('2023-01-01T10:00:00Z');
        expect(formatGameTime(mockDate.toISOString())).toMatch(/\d{1,2}:\d{2}/);
    });

    test('getUserDisplayName returns proper display name', () => {
        expect(getUserDisplayName('john_doe')).toBe('John Doe');
        expect(getUserDisplayName('alice')).toBe('Alice');
        expect(getUserDisplayName('')).toBe('Guest');
        expect(getUserDisplayName('test_user_123')).toBe('Test User 123');
    });
});
