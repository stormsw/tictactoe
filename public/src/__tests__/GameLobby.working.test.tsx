import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import GameLobby from '../components/GameLobby';

// Mock WebSocket hook to return empty data
vi.mock('../hooks/useWebSocket', () => ({
    useWebSocket: vi.fn(() => ({
        isConnected: true,
        sendMessage: vi.fn(),
        isReconnecting: false,
        messages: [] // Return empty array to avoid filter error
    })),
}));

// Mock API service 
vi.mock('../services/apiService', () => ({
    default: {
        getActiveGames: vi.fn(() => Promise.resolve([])),
        createGame: vi.fn(() => Promise.resolve({ id: 123 }))
    }
}));

describe('GameLobby Component (Working)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders without crashing', () => {
        const onJoinGame = vi.fn();
        render(<GameLobby onJoinGame={onJoinGame} />);

        // Just check it renders without error
        expect(document.body).toBeInTheDocument();
    });
});
