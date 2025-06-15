import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuthStore } from '../hooks/useAuthStore';

// Mock the API service
vi.mock('../services/api', () => ({
    default: {
        login: vi.fn(),
        register: vi.fn(),
        getCurrentUser: vi.fn(),
        setAuthToken: vi.fn(),
    },
}));

import apiService from '../services/api';

// Mock localStorage for zustand persist
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAuthStore Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        // Clear zustand store state between tests
        useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    });

    test('initial state is unauthenticated', () => {
        const { result } = renderHook(() => useAuthStore());
        
        expect(result.current.user).toBe(null);
        expect(result.current.token).toBe(null);
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('login success updates state', async () => {
        const mockAuthResponse = {
            access_token: 'test-token',
            user: { id: 1, username: 'testuser', email: 'test@example.com' }
        };
        
        vi.mocked(apiService.login).mockResolvedValue(mockAuthResponse);
        
        const { result } = renderHook(() => useAuthStore());
        
        let loginResult;
        await act(async () => {
            loginResult = await result.current.login('testuser', 'password123');
        });
        
        expect(loginResult).toBe(true);
        expect(result.current.user).toEqual(mockAuthResponse.user);
        expect(result.current.token).toBe('test-token');
        expect(result.current.isAuthenticated).toBe(true);
        expect(vi.mocked(apiService.setAuthToken)).toHaveBeenCalledWith('test-token');
    });

    test('login failure does not update state', async () => {
        vi.mocked(apiService.login).mockRejectedValue(new Error('Invalid credentials'));
        
        const { result } = renderHook(() => useAuthStore());
        
        let loginResult;
        await act(async () => {
            loginResult = await result.current.login('testuser', 'wrongpassword');
        });
        
        expect(loginResult).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.token).toBe(null);
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('register success updates state', async () => {
        const mockAuthResponse = {
            access_token: 'test-token',
            user: { id: 1, username: 'newuser', email: 'new@example.com' }
        };
        
        vi.mocked(apiService.register).mockResolvedValue(mockAuthResponse);
        
        const { result } = renderHook(() => useAuthStore());
        
        let registerResult;
        await act(async () => {
            registerResult = await result.current.register('newuser', 'new@example.com', 'password123');
        });
        
        expect(registerResult).toBe(true);
        expect(result.current.user).toEqual(mockAuthResponse.user);
        expect(result.current.token).toBe('test-token');
        expect(result.current.isAuthenticated).toBe(true);
        expect(vi.mocked(apiService.setAuthToken)).toHaveBeenCalledWith('test-token');
    });

    test('register failure does not update state', async () => {
        vi.mocked(apiService.register).mockRejectedValue(new Error('Registration failed'));
        
        const { result } = renderHook(() => useAuthStore());
        
        let registerResult;
        await act(async () => {
            registerResult = await result.current.register('newuser', 'new@example.com', 'password123');
        });
        
        expect(registerResult).toBe(false);
        expect(result.current.user).toBe(null);
        expect(result.current.token).toBe(null);
        expect(result.current.isAuthenticated).toBe(false);
    });

    test('logout clears state', async () => {
        const mockAuthResponse = {
            access_token: 'test-token',
            user: { id: 1, username: 'testuser', email: 'test@example.com' }
        };
        
        vi.mocked(apiService.login).mockResolvedValue(mockAuthResponse);
        
        const { result } = renderHook(() => useAuthStore());
        
        // First login
        await act(async () => {
            await result.current.login('testuser', 'password123');
        });
        
        expect(result.current.isAuthenticated).toBe(true);
        
        // Then logout
        act(() => {
            result.current.logout();
        });
        
        expect(result.current.user).toBe(null);
        expect(result.current.token).toBe(null);
        expect(result.current.isAuthenticated).toBe(false);
        expect(vi.mocked(apiService.setAuthToken)).toHaveBeenCalledWith(null);
    });

    test('checkAuth with valid token updates state', async () => {
        const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
        
        vi.mocked(apiService.getCurrentUser).mockResolvedValue(mockUser);
        
        // Set initial state with token
        useAuthStore.setState({
            user: null,
            token: 'existing-token',
            isAuthenticated: false,
        });
        
        const { result } = renderHook(() => useAuthStore());
        
        await act(async () => {
            await result.current.checkAuth();
        });
        
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(vi.mocked(apiService.setAuthToken)).toHaveBeenCalledWith('existing-token');
    });
});
