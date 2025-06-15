import { vi } from 'vitest';
import apiService from '../services/api';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Service', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockClear();
    });

    test('login makes correct API call', async () => {
        const mockResponse = {
            access_token: 'test-token',
            user: { id: 1, username: 'testuser', email: 'test@example.com' }
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });
        
        const result = await apiService.login('testuser', 'password123');
        
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        });
        
        expect(result).toEqual(mockResponse);
    });

    test('getLeaderboard makes correct API call', async () => {
        const mockLeaderboard = {
            entries: [
                { username: 'player1', wins: 10, losses: 2, draws: 1 },
                { username: 'player2', wins: 8, losses: 4, draws: 2 },
            ]
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockLeaderboard),
        });
        
        const result = await apiService.getLeaderboard(20);
        
        expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/?limit=20', {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(result).toEqual(mockLeaderboard);
    });

    test('getMyStats makes correct API call', async () => {
        const mockStats = {
            wins: 5,
            losses: 2,
            draws: 1,
            total_games: 8,
            win_rate: 62.5
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockStats),
        });
        
        const result = await apiService.getMyStats();
        
        expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/me', {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        expect(result).toEqual(mockStats);
    });

    test('createGame makes correct API call', async () => {
        const mockGame = {
            id: 1,
            board: ['', '', '', '', '', '', '', '', ''],
            status: 'waiting',
            player_x: { id: 1, username: 'player1' },
        };
        
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockGame),
        });
        
        const result = await apiService.createGame();
        
        expect(mockFetch).toHaveBeenCalledWith('/api/games/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player2_id: undefined,
                player2_type: 'human'
            }),
        });
        
        expect(result).toEqual(mockGame);
    });

    test('handles API errors correctly', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad Request',
            json: () => Promise.resolve({ detail: 'Bad request' }),
        });
        
        await expect(apiService.login('user', 'pass')).rejects.toThrow('Bad request');
    });
});
