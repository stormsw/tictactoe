import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import GameLobby from '../components/GameLobby';

// Mock all the dependencies using factory functions to avoid hoisting issues
vi.mock('../hooks/useWebSocket', () => ({
    useWebSocket: vi.fn(),
}));

vi.mock('../hooks/useAuthStore', () => ({
    useAuthStore: vi.fn(),
}));

vi.mock('../services/api', () => ({
    default: {
        getActiveGames: vi.fn(),
        createGame: vi.fn(),
    },
}));

// Import mocked modules and get typed mock functions
import { useAuthStore } from '../hooks/useAuthStore';
import { useWebSocket } from '../hooks/useWebSocket';
import apiService from '../services/api';

const mockUseWebSocket = vi.mocked(useWebSocket);
const mockUseAuthStore = vi.mocked(useAuthStore);
const mockGetActiveGames = vi.mocked(apiService.getActiveGames);
const mockCreateGame = vi.mocked(apiService.createGame);

describe('GameLobby Component (Simple)', () => {
    // Create mock functions and data
    const mockSendMessage = vi.fn();
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

    beforeEach(() => {
        vi.clearAllMocks();

        // Set up mocks
        mockUseWebSocket.mockReturnValue({
            isConnected: true,
            sendMessage: mockSendMessage,
            messages: [], // Ensure messages is always an array
            joinGame: vi.fn(),
            leaveGame: vi.fn(),
            clearMessages: vi.fn(),
        });

        mockUseAuthStore.mockReturnValue({
            user: mockUser,
            isAuthenticated: true,
            checkAuth: vi.fn(),
        });

        // Mock the API calls to return successful promises
        mockGetActiveGames.mockResolvedValue([]);
        mockCreateGame.mockResolvedValue({ id: 123 });
    });

    test('renders without crashing', () => {
        const onJoinGame = vi.fn();
        render(<GameLobby onJoinGame={onJoinGame} />);

        expect(document.body).toBeInTheDocument();
    });

    test('shows game lobby heading', async () => {
        const onJoinGame = vi.fn();
        render(<GameLobby onJoinGame={onJoinGame} />);

        // Wait for the component to load and show the heading
        await waitFor(() => {
            expect(screen.getByText('Game Lobby')).toBeInTheDocument();
        }, { timeout: 3000 });
    });
});
