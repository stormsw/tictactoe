/**
 * Basic utility functions for testing
 */

export const formatUserName = (username: string): string => {
  return username.charAt(0).toUpperCase() + username.slice(1);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const generateGameId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
