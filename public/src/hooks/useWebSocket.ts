import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  data: any;
}

export const useWebSocket = (userId: number | null) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${userId}`;

    // Connect to WebSocket
    const socket = io(wsUrl, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('message', (message: WebSocketMessage) => {
      console.log('WebSocket message received:', message);
      setMessages(prev => [...prev, message]);
    });

    socket.on('game_update', (data: any) => {
      console.log('Game update received:', data);
      setMessages(prev => [...prev, { type: 'game_update', data }]);
    });

    socket.on('games_list_update', (data: any) => {
      console.log('Games list update received:', data);
      setMessages(prev => [...prev, { type: 'games_list_update', data }]);
    });

    socket.on('player_joined', (data: any) => {
      console.log('Player joined:', data);
      setMessages(prev => [...prev, { type: 'player_joined', data }]);
    });

    socket.on('player_left', (data: any) => {
      console.log('Player left:', data);
      setMessages(prev => [...prev, { type: 'player_left', data }]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const sendMessage = (message: WebSocketMessage) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('message', message);
    }
  };

  const joinGame = (gameId: number) => {
    sendMessage({
      type: 'join_game',
      data: { game_id: gameId }
    });
  };

  const leaveGame = (gameId: number) => {
    sendMessage({
      type: 'leave_game',
      data: { game_id: gameId }
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    isConnected,
    messages,
    sendMessage,
    joinGame,
    leaveGame,
    clearMessages,
  };
};
