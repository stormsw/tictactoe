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

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function formatGameTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getUserDisplayName(username: string): string {
    if (!username) return 'Guest';
    return username
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function calculateWinRate(wins: number, totalGames: number): number {
    if (totalGames === 0) return 0;
    return Math.round((wins / totalGames) * 100);
}

export function formatPlayerStats(wins: number, losses: number, draws: number): string {
    const total = wins + losses + draws;
    const winRate = calculateWinRate(wins, total);
    return `${wins}W-${losses}L-${draws}D (${winRate}%)`;
}
