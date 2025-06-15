import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Leaderboard from '../components/Leaderboard';

// Mock the API service with vi.fn() directly in factory
vi.mock('../services/api', () => ({
    default: {
        getLeaderboard: vi.fn(),
        getMyStats: vi.fn(),
    },
}));

// Import the mocked service to access the mock functions
import apiService from '../services/api';

// Get typed mock functions
const mockGetLeaderboard = vi.mocked(apiService.getLeaderboard);
const mockGetMyStats = vi.mocked(apiService.getMyStats);

const mockLeaderboardData = [
    {
        user_id: 1,
        username: 'player1',
        rank: 1,
        games_played: 20,
        games_won: 15,
        games_lost: 3,
        games_drawn: 2,
        win_rate: 0.75,
        avg_moves_per_game: 15.5
    },
    {
        user_id: 2,
        username: 'player2',
        rank: 2,
        games_played: 20,
        games_won: 12,
        games_lost: 5,
        games_drawn: 3,
        win_rate: 0.60,
        avg_moves_per_game: 16.2
    },
    {
        user_id: 3,
        username: 'player3',
        rank: 3,
        games_played: 16,
        games_won: 8,
        games_lost: 7,
        games_drawn: 1,
        win_rate: 0.50,
        avg_moves_per_game: 17.1
    },
];

const mockUserStats = {
    username: 'testuser',
    games_played: 10,
    games_won: 5,
    games_lost: 3,
    games_drawn: 2,
    win_rate: 0.5,
    avg_moves_per_game: 16.0
};

describe('Leaderboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders loading state initially', () => {
        mockGetLeaderboard.mockImplementation(
            () => new Promise(() => { }) // Never resolves
        );
        mockGetMyStats.mockImplementation(
            () => new Promise(() => { }) // Never resolves
        );

        render(<Leaderboard />);

        // The component shows spinner while loading
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('renders leaderboard data correctly', async () => {
        mockGetLeaderboard.mockResolvedValue({
            entries: mockLeaderboardData
        });
        mockGetMyStats.mockResolvedValue(mockUserStats);

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        });

        // Check if all players are displayed
        expect(screen.getByText('player1')).toBeInTheDocument();
        expect(screen.getByText('player2')).toBeInTheDocument();
        expect(screen.getByText('player3')).toBeInTheDocument();

        // Check stats for first player - format is "15" for wins, "3L / 2D" for losses/draws
        expect(screen.getByText('15')).toBeInTheDocument(); // wins
        expect(screen.getByText('3L / 2D')).toBeInTheDocument(); // losses/draws format
        expect(screen.getByText('75.0%')).toBeInTheDocument(); // win rate
    });

    test('displays ranking numbers correctly', async () => {
        mockGetLeaderboard.mockResolvedValue({
            entries: mockLeaderboardData
        });
        mockGetMyStats.mockResolvedValue(mockUserStats);

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        });

        // Check ranking positions
        const rankings = screen.getAllByText(/^#[123]$/);
        expect(rankings).toHaveLength(3);
        expect(rankings[0]).toHaveTextContent('#1');
        expect(rankings[1]).toHaveTextContent('#2');
        expect(rankings[2]).toHaveTextContent('#3');
    });

    test('displays medal emojis for top players', async () => {
        mockGetLeaderboard.mockResolvedValue({
            entries: mockLeaderboardData
        });
        mockGetMyStats.mockResolvedValue(mockUserStats);

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        });

        // First place should have gold medal
        const firstPlaceRow = screen.getByText('player1').closest('tr');
        expect(firstPlaceRow).toHaveTextContent('🥇');

        // Second place should have silver medal
        const secondPlaceRow = screen.getByText('player2').closest('tr');
        expect(secondPlaceRow).toHaveTextContent('🥈');

        // Third place should have bronze medal
        const thirdPlaceRow = screen.getByText('player3').closest('tr');
        expect(thirdPlaceRow).toHaveTextContent('🥉');
    });

    test('handles error state correctly', async () => {
        mockGetLeaderboard.mockRejectedValue(new Error('Failed to load leaderboard'));
        mockGetMyStats.mockRejectedValue(new Error('Failed to load stats'));

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load leaderboard data')).toBeInTheDocument();
        });
    });

    test('displays empty state when no data available', async () => {
        mockGetLeaderboard.mockResolvedValue({
            entries: []
        });
        mockGetMyStats.mockResolvedValue(mockUserStats);

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('No leaderboard data available yet. Play some games to see rankings!')).toBeInTheDocument();
        });
    });

    test('calculates and displays win rates correctly', async () => {
        const dataWithDifferentRates = [
            {
                user_id: 1,
                username: 'perfectplayer',
                rank: 1,
                games_played: 10,
                games_won: 10,
                games_lost: 0,
                games_drawn: 0,
                win_rate: 1.0,
                avg_moves_per_game: 12.0
            },
            {
                user_id: 2,
                username: 'newbie',
                rank: 2,
                games_played: 5,
                games_won: 0,
                games_lost: 5,
                games_drawn: 0,
                win_rate: 0.0,
                avg_moves_per_game: 18.0
            },
        ];

        mockGetLeaderboard.mockResolvedValue({
            entries: dataWithDifferentRates
        });
        mockGetMyStats.mockResolvedValue(mockUserStats);

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('100.0%')).toBeInTheDocument();
            expect(screen.getByText('0.0%')).toBeInTheDocument();
        });
    });

    test('displays total games correctly', async () => {
        mockGetLeaderboard.mockResolvedValue({
            entries: mockLeaderboardData
        });
        mockGetMyStats.mockResolvedValue(mockUserStats);

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        });

        // Check total games for each player - both player1 and player2 have 20 games
        const gamesOf20 = screen.getAllByText('20');
        expect(gamesOf20).toHaveLength(2); // player1 and player2
        expect(screen.getByText('16')).toBeInTheDocument(); // player3
    });

    test('calls API service on component mount', async () => {
        mockGetLeaderboard.mockResolvedValue({
            entries: mockLeaderboardData
        });
        mockGetMyStats.mockResolvedValue(mockUserStats);

        render(<Leaderboard />);

        expect(mockGetLeaderboard).toHaveBeenCalledTimes(1);
        expect(mockGetMyStats).toHaveBeenCalledTimes(1);
    });

    test('shows refresh capability on error', async () => {
        mockGetLeaderboard.mockRejectedValue(new Error('Network error'));
        mockGetMyStats.mockRejectedValue(new Error('Network error'));

        render(<Leaderboard />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load leaderboard data')).toBeInTheDocument();
        });

        // Look for the refresh button
        const refreshButton = screen.getByText('Refresh');
        expect(refreshButton).toBeInTheDocument();
    });
});