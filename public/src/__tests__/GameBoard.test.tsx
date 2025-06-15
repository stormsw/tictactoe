import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import GameBoard from '../components/GameBoard';

// Mock dependencies - using direct vi.fn() in factory functions
vi.mock('../hooks/useWebSocket', () => ({
    useWebSocket: vi.fn(),
}));

vi.mock('../hooks/useAuthStore', () => ({
    useAuthStore: () => ({
        user: { id: 1, username: 'testuser', email: 'test@example.com' },
    }),
}));

vi.mock('../services/api', () => ({
    default: {
        getGame: vi.fn(),
        makeMove: vi.fn(),
        joinGame: vi.fn(),
    },
}));

// Import mocked modules and get typed mock functions
import { useWebSocket } from '../hooks/useWebSocket';
import apiService from '../services/api';

const mockUseWebSocket = vi.mocked(useWebSocket);
const mockGetGame = vi.mocked(apiService.getGame);
const mockMakeMove = vi.mocked(apiService.makeMove);

// Create a mock for onLeaveGame prop  
const mockOnLeaveGame = vi.fn();

const mockGameData = {
    id: 1,
    player1_id: 1,
    player2_id: 2,
    player2_type: 'human' as const,
    board_state: ['', '', '', '', '', '', '', '', ''],
    current_turn: 'X' as const,
    status: 'in_progress' as const,
    winner_id: null,
    total_moves: 0,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    player1: { id: 1, username: 'player1', email: 'p1@test.com', created_at: '2023-01-01T00:00:00Z' },
    player2: { id: 2, username: 'player2', email: 'p2@test.com', created_at: '2023-01-01T00:00:00Z' },
};

describe('GameBoard Component', () => {
    // Create mock functions for WebSocket
    const mockJoinGame = vi.fn();
    const mockLeaveGame = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetGame.mockResolvedValue(mockGameData);
        
        // Set up WebSocket mock return value
        mockUseWebSocket.mockReturnValue({
            messages: [],
            joinGame: mockJoinGame,
            leaveGame: mockLeaveGame,
            sendMessage: vi.fn(),
            isConnected: true,
            clearMessages: vi.fn(),
        });
    });

    test('renders loading state initially', () => {
        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        // The component shows a spinner - look for the animate-spin class
        expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('loads and displays game data', async () => {
        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(mockGetGame).toHaveBeenCalledWith(1);
        });

        await waitFor(() => {
            // The component shows the game status, not "player1 (X) vs player2 (O)"
            expect(screen.getByText('Player 1\'s turn (X)')).toBeInTheDocument();
        });
    });

    test('renders game board with correct grid', async () => {
        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            // Game board cells have class "game-cell", look for buttons within the game board
            const cells = screen.getAllByRole('button');
            const gameCells = cells.filter(button => button.className.includes('game-cell'));
            expect(gameCells).toHaveLength(9);
        });
    });

    test('handles cell click for valid move', async () => {
        mockMakeMove.mockResolvedValue({ success: true });

        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('Player 1\'s turn (X)')).toBeInTheDocument();
        });

        const cells = screen.getAllByRole('button');
        const gameCells = cells.filter(button => button.className.includes('game-cell'));
        fireEvent.click(gameCells[0]);

        await waitFor(() => {
            expect(mockMakeMove).toHaveBeenCalledWith(1, 0);
        });
    });

    test('prevents move when not player turn', async () => {
        const gameDataNotMyTurn = {
            ...mockGameData,
            current_turn: 'O' as const, // Not the current user's turn
        };
        mockGetGame.mockResolvedValue(gameDataNotMyTurn);

        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('Player 2\'s turn (O)')).toBeInTheDocument();
        });

        const cells = screen.getAllByRole('button');
        const gameCells = cells.filter(button => button.className.includes('game-cell'));
        fireEvent.click(gameCells[0]);

        await waitFor(() => {
            expect(mockMakeMove).not.toHaveBeenCalled();
        });
    });

    test('prevents move on occupied cell', async () => {
        const gameDataWithMoves = {
            ...mockGameData,
            board_state: ['X', '', '', '', '', '', '', '', ''],
        };
        mockGetGame.mockResolvedValue(gameDataWithMoves);

        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('Player 1\'s turn (X)')).toBeInTheDocument();
        });

        const cells = screen.getAllByRole('button');
        const gameCells = cells.filter(button => button.className.includes('game-cell'));
        fireEvent.click(gameCells[0]); // Cell 0 already has 'X'

        await waitFor(() => {
            expect(mockMakeMove).not.toHaveBeenCalled();
        });
    });

    test('displays winner when game is completed', async () => {
        const completedGame = {
            ...mockGameData,
            status: 'completed' as const,
            winner_id: 1,
            board_state: ['X', 'X', 'X', '', '', '', '', '', ''],
        };
        mockGetGame.mockResolvedValue(completedGame);

        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('Player 1 (X) wins!')).toBeInTheDocument();
        });
    });

    test('displays draw when game ends in tie', async () => {
        const drawGame = {
            ...mockGameData,
            status: 'completed' as const,
            winner_id: null,
            board_state: ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'],
        };
        mockGetGame.mockResolvedValue(drawGame);

        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('It\'s a draw!')).toBeInTheDocument();
        });
    });

    test('handles leave game button click', async () => {
        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('Leave Game')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Leave Game'));

        expect(mockOnLeaveGame).toHaveBeenCalled();
    });

    test('joins game via WebSocket on mount', () => {
        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        expect(mockJoinGame).toHaveBeenCalledWith(1);
    });

    test('leaves game via WebSocket on unmount', () => {
        const { unmount } = render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        unmount();

        expect(mockLeaveGame).toHaveBeenCalledWith(1);
    });

    test('displays error message when game load fails', async () => {
        mockGetGame.mockRejectedValue(new Error('Game not found'));

        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load game')).toBeInTheDocument();
        });
    });

    test('shows observer mode when user is not a player', async () => {
        const observerGame = {
            ...mockGameData,
            player1_id: 2,
            player2_id: 3,
            player1: { id: 2, username: 'other1', email: 'o1@test.com', created_at: '2023-01-01T00:00:00Z' },
            player2: { id: 3, username: 'other2', email: 'o2@test.com', created_at: '2023-01-01T00:00:00Z' },
        };
        mockGetGame.mockResolvedValue(observerGame);

        render(<GameBoard gameId={1} onLeaveGame={mockOnLeaveGame} />);

        await waitFor(() => {
            expect(screen.getByText('You are watching this game as an observer')).toBeInTheDocument();
        });
    });
});
