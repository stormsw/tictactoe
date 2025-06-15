import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import GameBoard from '../components/GameBoard';

// Mock all the dependencies
const mockSendMessage = vi.fn();
const mockJoinGame = vi.fn();
const mockLeaveGame = vi.fn();
const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

vi.mock('../hooks/useWebSocket', () => ({
    useWebSocket: vi.fn(() => ({
        isConnected: true,
        sendMessage: mockSendMessage,
        isReconnecting: false,
        messages: [],
        joinGame: mockJoinGame,
        leaveGame: mockLeaveGame,
    })),
}));

vi.mock('../hooks/useAuthStore', () => ({
    useAuthStore: vi.fn(() => ({
        user: mockUser,
        isAuthenticated: true,
        checkAuth: vi.fn(),
    })),
}));

vi.mock('../services/api', () => ({
    default: {
        getGame: vi.fn(() => Promise.resolve({
            id: 123,
            player1_id: 1,
            player2_id: 2,
            player2_type: 'human',
            board_state: ['', '', '', '', '', '', '', '', ''],
            current_turn: 'X',
            status: 'in_progress',
            total_moves: 0,
            created_at: '2023-01-01',
        })),
        makeMove: vi.fn(() => Promise.resolve({ success: true }))
    }
}));

describe('GameBoard Component (Simple)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders loading state initially', () => {
        render(<GameBoard gameId={123} onLeaveGame={vi.fn()} />);

        // Should show loading spinner
        expect(document.querySelector('.animate-spin')).toBeTruthy();
    });

    test('can be rendered without crashing', () => {
        const onLeaveGame = vi.fn();
        render(<GameBoard gameId={123} onLeaveGame={onLeaveGame} />);

        // Just check it renders
        expect(document.body).toBeInTheDocument();
    });
});
