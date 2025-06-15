import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Navigation from '../components/Navigation';

// Mock the useAuthStore hook
vi.mock('../hooks/useAuthStore', () => ({
    useAuthStore: () => ({
        logout: vi.fn(),
    }),
}));

const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    created_at: '2023-01-01T00:00:00Z',
};

const defaultProps = {
    currentView: 'lobby' as const,
    setCurrentView: vi.fn(),
    user: mockUser,
    isConnected: true,
};

describe('Navigation Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders navigation items', () => {
        render(<Navigation {...defaultProps} />);

        // Use getAllByText since navigation items appear in both desktop and mobile versions
        expect(screen.getAllByText('Game Lobby')).toHaveLength(2);
        expect(screen.getAllByText('Leaderboard')).toHaveLength(2);
    });

    test('shows user information when logged in', () => {
        render(<Navigation {...defaultProps} />);

        expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('shows connection status', () => {
        render(<Navigation {...defaultProps} />);

        // Check for connection status text instead of emoji
        expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    test('shows disconnected status when not connected', () => {
        render(<Navigation {...defaultProps} isConnected={false} />);

        // Check for disconnection status text instead of emoji
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    test('calls setCurrentView when navigation item is clicked', () => {
        const setCurrentViewMock = vi.fn();
        render(<Navigation {...defaultProps} setCurrentView={setCurrentViewMock} />);

        // Click the first Leaderboard button (desktop version)
        const leaderboardButtons = screen.getAllByText('Leaderboard');
        fireEvent.click(leaderboardButtons[0]);
        expect(setCurrentViewMock).toHaveBeenCalledWith('leaderboard');
    });
});
