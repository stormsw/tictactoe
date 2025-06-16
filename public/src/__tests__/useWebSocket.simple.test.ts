import '@testing-library/jest-dom';
import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useWebSocket } from '../hooks/useWebSocket';

// Mock WebSocket
const mockWebSocket = {
    send: vi.fn(),
    close: vi.fn(),
    readyState: WebSocket.OPEN,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
} as unknown as WebSocket;

describe('useWebSocket Hook (Simple)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.WebSocket = vi.fn(() => mockWebSocket) as any;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('hook can be called', () => {
        const { result } = renderHook(() => useWebSocket(1));
        
        // Just check that the hook returns an object
        expect(result.current).toBeDefined();
        expect(typeof result.current).toBe('object');
    });

    test('hook can be called with null userId', () => {
        const { result } = renderHook(() => useWebSocket(null));
        
        // Just check that the hook returns an object
        expect(result.current).toBeDefined();
        expect(typeof result.current).toBe('object');
        expect(result.current.isConnected).toBe(false);
    });
});
