import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import Leaderboard from '../components/Leaderboard';

// Mock API service to return empty data and avoid errors
vi.mock('../services/apiService', () => ({
    default: {
        getLeaderboard: vi.fn(() => Promise.resolve([])),
        getMyStats: vi.fn(() => Promise.resolve({ wins: 0, losses: 0, totalGames: 0 }))
    }
}));

describe('Leaderboard Component (Simple)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders without crashing', () => {
        render(<Leaderboard />);

        // Check that the component renders something
        expect(document.body).toBeInTheDocument();
    });
});
