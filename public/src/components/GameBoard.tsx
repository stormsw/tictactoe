import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../hooks/useAuthStore';
import apiService from '../services/api';
import type { GameData } from '../types';

interface GameBoardProps {
  gameId: number;
  onLeaveGame: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameId, onLeaveGame }) => {
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isObserver, setIsObserver] = useState(false);

  const { user } = useAuthStore();
  const { messages, joinGame, leaveGame } = useWebSocket(user?.id ?? null);

  useEffect(() => {
    loadGame();
    if (user?.id) {
      joinGame(gameId);
    }

    return () => {
      if (user?.id) {
        leaveGame(gameId);
      }
    };
  }, [gameId, user?.id]);

  // Listen for game updates via WebSocket
  useEffect(() => {
    const gameUpdates = messages.filter(
      msg => msg.type === 'game_update' && msg.data.game_id === gameId
    );
    
    if (gameUpdates.length > 0) {
      const latestUpdate = gameUpdates[gameUpdates.length - 1];
      if (latestUpdate.data.game) {
        setGame(latestUpdate.data.game as GameData);
      }
    }
  }, [messages, gameId]);

  const loadGame = async () => {
    try {
      setError('');
      const gameData = await apiService.getGame(gameId) as GameData;
      setGame(gameData);
      
      // Check if user is observer
      const isPlayerInGame = gameData.player1_id === Number(user?.id) || gameData.player2_id === Number(user?.id);
      setIsObserver(!isPlayerInGame);
    } catch (err) {
      setError('Failed to load game');
      console.error('Error loading game:', err);
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (position: number) => {
    if (!game || game.status !== 'in_progress' || isObserver) {
      return;
    }

    // Check if it's the current user's turn
    const isPlayer1 = game.player1_id === Number(user?.id);
    const isPlayer2 = game.player2_id === Number(user?.id);
    const isUserTurn = (game.current_turn === 'X' && isPlayer1) || 
                       (game.current_turn === 'O' && isPlayer2);

    if (!isUserTurn) {
      return;
    }

    // Check if position is empty
    if (game.board_state[position] !== '') {
      return;
    }

    try {
      setError('');
      const updatedGame = await apiService.makeMove(gameId, position) as GameData;
      setGame(updatedGame);
    } catch (err) {
      setError('Failed to make move');
      console.error('Error making move:', err);
    }
  };

  const getPlayerSymbol = (playerId: number) => {
    if (!game) return '';
    return game.player1_id === playerId ? 'X' : 'O';
  };

  const getCurrentPlayerName = () => {
    if (!game) return '';
    
    if (game.current_turn === 'X') {
      return 'Player 1'; // Could be enhanced to show actual username
    } else {
      return game.player2_type === 'ai' ? 'Computer' : 'Player 2';
    }
  };

  const getGameStatus = () => {
    if (!game) return '';

    if (game.status === 'completed') {
      if (game.winner_id) {
        const winnerSymbol = getPlayerSymbol(game.winner_id);
        const isPlayer1Winner = game.winner_id === game.player1_id;
        let winnerName = 'Player 1';
        if (!isPlayer1Winner) {
          winnerName = game.player2_type === 'ai' ? 'Computer' : 'Player 2';
        }
        return `${winnerName} (${winnerSymbol}) wins!`;
      } else {
        return "It's a draw!";
      }
    }

    if (game.status === 'in_progress') {
      return `${getCurrentPlayerName()}'s turn (${game.current_turn})`;
    }

    return 'Waiting for players...';
  };

  const canMakeMove = (position: number) => {
    if (!game || game.status !== 'in_progress' || isObserver) {
      return false;
    }

    const isPlayer1 = game.player1_id === Number(user?.id);
    const isPlayer2 = game.player2_id === Number(user?.id);
    const isUserTurn = (game.current_turn === 'X' && isPlayer1) || 
                       (game.current_turn === 'O' && isPlayer2);

    return isUserTurn && game.board_state[position] === '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="text-center">
        <p className="text-red-600">{error || 'Game not found'}</p>
        <button
          onClick={onLeaveGame}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  // Additional safety check for board_state
  if (!game.board_state || !Array.isArray(game.board_state)) {
    return (
      <div className="text-center">
        <p className="text-red-600">Invalid game data</p>
        <button
          onClick={() => loadGame()}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mr-2"
        >
          Retry
        </button>
        <button
          onClick={onLeaveGame}
          className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          Back to Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        {/* Game Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Game #{game.id}</h2>
          <button
            onClick={onLeaveGame}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            Leave Game
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isObserver && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            You are watching this game as an observer
          </div>
        )}

        {/* Game Status */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-gray-900">
            {getGameStatus()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Moves: {game.total_moves}
          </p>
        </div>

        {/* Game Board */}
        <div className="game-board mx-auto mb-6">
          {game.board_state?.map((cell: string, index: number) => (
            <button
              key={`game-${game.id}-cell-${index}`}
              className={`game-cell ${cell.toLowerCase()} ${
                canMakeMove(index) ? 'hover:bg-gray-100' : ''
              }`}
              onClick={() => makeMove(index)}
              disabled={!canMakeMove(index)}
            >
              {cell}
            </button>
          ))}
        </div>

        {/* Player Info */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Player 1 (X)</h3>
            <p className="text-sm text-gray-600">Human</p>
            {game.current_turn === 'X' && game.status === 'in_progress' && (
              <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Current Turn
              </span>
            )}
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Player 2 (O)</h3>
            <p className="text-sm text-gray-600">
              {game.player2_type === 'ai' ? 'Computer' : 'Human'}
            </p>
            {game.current_turn === 'O' && game.status === 'in_progress' && (
              <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Current Turn
              </span>
            )}
          </div>
        </div>

        {/* Game completed actions */}
        {game.status === 'completed' && (
          <div className="text-center mt-6">
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 mr-4"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
