import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App';

// Mock all the dependencies using factory functions to avoid hoisting issues
vi.mock('../hooks/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));

vi.mock('../hooks/useWebSocket', () => ({
    useWebSocket: vi.fn(),
}));

vi.mock('../components/Auth/LoginForm', () => ({
    default: () => <div data-testid="login-form">Login Form</div>,
}));

vi.mock('../components/GameLobby', () => ({
    default: ({ onJoinGame }: { onJoinGame: (gameId: number) => void }) => (
        <div data-testid="game-lobby">
            Game Lobby
            <button onClick={() => onJoinGame(123)}>Join Game 123</button>
        </div>
    ),
}));

vi.mock('../components/GameBoard', () => ({
    default: ({ gameId, onLeaveGame }: { gameId: number; onLeaveGame: () => void }) => (
        <div data-testid="game-board">
            Game Board - Game ID: {gameId}
            <button onClick={onLeaveGame}>Leave Game</button>
        </div>
    ),
}));

vi.mock('../components/Leaderboard', () => ({
    default: () => <div data-testid="leaderboard">Leaderboard</div>,
}));

vi.mock('../components/Navigation', () => ({
    default: ({
        currentView,
        setCurrentView,
        user,
        isConnected
    }: {
        currentView: string;
        setCurrentView: (view: string) => void;
        user: any;
        isConnected: boolean;
    }) => (
        <nav data-testid="navigation">
            Navigation - View: {currentView} - Connected: {isConnected ? 'Yes' : 'No'}
            {user && <span> - User: {user.username}</span>}
            <button onClick={() => setCurrentView('lobby')}>Lobby</button>
            <button onClick={() => setCurrentView('leaderboard')}>Leaderboard</button>
        </nav>
    ),
}));

// Import mocked modules and get typed mock functions
import { useAuthStore } from '../hooks/useAuthStore';
import { useWebSocket } from '../hooks/useWebSocket';

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseWebSocket = vi.mocked(useWebSocket);

describe('App Component', () => {
    // Create mock functions for auth store
    const mockCheckAuth = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Set up default mocks
        mockUseAuthStore.mockReturnValue({
            user: null,
            isAuthenticated: false,
            checkAuth: mockCheckAuth,
        });

        mockUseWebSocket.mockReturnValue({
            isConnected: true,
            messages: [],
            sendMessage: vi.fn(),
            joinGame: vi.fn(),
            leaveGame: vi.fn(),
            clearMessages: vi.fn(),
        });
    });

    test('shows login form when not authenticated', () => {
        render(<App />);

        expect(screen.getByTestId('login-form')).toBeInTheDocument();
        expect(screen.getByText('Tic-Tac-Toe Game')).toBeInTheDocument();
        expect(screen.getByText('Sign in to start playing')).toBeInTheDocument();
        expect(screen.queryByTestId('navigation')).not.toBeInTheDocument();
    });

    test('calls checkAuth on mount', () => {
        render(<App />);

        expect(mockCheckAuth).toHaveBeenCalled();
    });

    test('shows main app interface when authenticated', () => {
        mockUseAuthStore.mockReturnValue({
            user: { id: 1, username: 'testuser', email: 'test@example.com' },
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        expect(screen.getByTestId('navigation')).toBeInTheDocument();
        expect(screen.getByTestId('game-lobby')).toBeInTheDocument();
        expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
    });

    test('displays lobby view by default when authenticated', () => {
        mockUseAuthStore.mockReturnValue({
            user: { id: 1, username: 'testuser', email: 'test@example.com' },
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        expect(screen.getByTestId('game-lobby')).toBeInTheDocument();
        expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
        expect(screen.queryByTestId('leaderboard')).not.toBeInTheDocument();
    });

    test('handles joining a game', async () => {
        mockUseAuthStore.mockReturnValue({
            user: { id: 1, username: 'testuser', email: 'test@example.com' },
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        // Click join game button in GameLobby
        const joinButton = screen.getByText('Join Game 123');
        fireEvent.click(joinButton);

        await waitFor(() => {
            expect(screen.getByTestId('game-board')).toBeInTheDocument();
            expect(screen.getByText('Game Board - Game ID: 123')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('game-lobby')).not.toBeInTheDocument();
    });

    test('handles leaving a game', async () => {
        mockUseAuthStore.mockReturnValue({
            user: { id: 1, username: 'testuser', email: 'test@example.com' },
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        // First join a game
        const joinButton = screen.getByText('Join Game 123');
        fireEvent.click(joinButton);

        await waitFor(() => {
            expect(screen.getByTestId('game-board')).toBeInTheDocument();
        });

        // Then leave the game
        const leaveButton = screen.getByText('Leave Game');
        fireEvent.click(leaveButton);

        await waitFor(() => {
            expect(screen.getByTestId('game-lobby')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
    });

    test('displays leaderboard when navigation clicked', async () => {
        mockUseAuthStore.mockReturnValue({
            user: { id: 1, username: 'testuser', email: 'test@example.com' },
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        const leaderboardButton = screen.getByText('Leaderboard');
        fireEvent.click(leaderboardButton);

        await waitFor(() => {
            expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
        });

        expect(screen.queryByTestId('game-lobby')).not.toBeInTheDocument();
    });

    test('passes correct props to Navigation component', () => {
        const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

        mockUseAuthStore.mockReturnValue({
            user: mockUser,
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        expect(screen.getByText(/View: lobby/)).toBeInTheDocument();
        expect(screen.getByText(/Connected: Yes/)).toBeInTheDocument();
    });

    test('shows disconnected status when WebSocket is not connected', () => {
        mockUseWebSocket.mockReturnValue({
            isConnected: false,
            messages: [],
            sendMessage: vi.fn(),
            joinGame: vi.fn(),
            leaveGame: vi.fn(),
            clearMessages: vi.fn(),
        });

        mockUseAuthStore.mockReturnValue({
            user: { id: 1, username: 'testuser', email: 'test@example.com' },
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        expect(screen.getByText(/Connected: No/)).toBeInTheDocument();
    });

    test('does not render game board without gameId', () => {
        mockUseAuthStore.mockReturnValue({
            user: { id: 1, username: 'testuser', email: 'test@example.com' },
            isAuthenticated: true,
            checkAuth: mockCheckAuth,
        });

        render(<App />);

        // Even if we somehow set currentView to 'game' without a gameId, 
        // the game board should not render due to the condition
        expect(screen.queryByTestId('game-board')).not.toBeInTheDocument();
    });
});
