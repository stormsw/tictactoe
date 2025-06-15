import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';

// Mock all the dependencies with simple working mocks
const mockCheckAuth = vi.fn();

vi.mock('../hooks/useAuthStore', () => ({
    useAuthStore: vi.fn(() => ({
        user: null,
        isAuthenticated: false,
        checkAuth: mockCheckAuth,
    })),
}));

vi.mock('../hooks/useWebSocket', () => ({
    useWebSocket: vi.fn(() => ({
        isConnected: true,
        sendMessage: vi.fn(),
        isReconnecting: false
    })),
}));

vi.mock('../components/Auth/LoginForm', () => ({
    default: () => <div data-testid="login-form">Login Form</div>,
}));

vi.mock('../components/GameLobby', () => ({
    default: () => <div data-testid="game-lobby">Game Lobby</div>,
}));

vi.mock('../components/GameBoard', () => ({
    default: () => <div data-testid="game-board">Game Board</div>,
}));

vi.mock('../components/Leaderboard', () => ({
    default: () => <div data-testid="leaderboard">Leaderboard</div>,
}));

vi.mock('../components/Navigation', () => ({
    default: () => <nav data-testid="navigation">Navigation</nav>,
}));

describe('App Component (Simple)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders and calls checkAuth', () => {
        render(<App />);

        expect(mockCheckAuth).toHaveBeenCalled();
        expect(screen.getByText('Tic-Tac-Toe Game')).toBeInTheDocument();
    });

    test('shows login form when not authenticated', () => {
        render(<App />);

        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        expect(screen.getByText('Sign in to start playing')).toBeInTheDocument();
    });
});
