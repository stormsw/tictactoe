import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuthStore } from '../hooks/useAuthStore';
import apiService from '../services/api';
import type { GameLobbyItem } from '../types';

interface GameLobbyProps {
  onJoinGame: (gameId: number) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onJoinGame }) => {
  const [games, setGames] = useState<GameLobbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingGame, setCreatingGame] = useState(false);
  
  const { user } = useAuthStore();
  const { messages } = useWebSocket(user?.id ?? null);

  useEffect(() => {
    loadGames();
  }, []);

  // Listen for WebSocket updates
  useEffect(() => {
    const gameListUpdates = messages.filter(msg => msg.type === 'games_list_update');
    if (gameListUpdates.length > 0) {
      loadGames();
    }
  }, [messages]);

  const loadGames = async () => {
    try {
      setError('');
      const data = await apiService.getActiveGames() as GameLobbyItem[];
      setGames(data);
    } catch (err) {
      setError('Failed to load games');
      console.error('Error loading games:', err);
    } finally {
      setLoading(false);
    }
  };

  const createNewGame = async (gameType: 'human' | 'ai') => {
    try {
      setCreatingGame(true);
      setError('');
      
      const game = await apiService.createGame(
        undefined, // no specific player2
        gameType
      ) as GameLobbyItem;
      
      // Join the newly created game
      onJoinGame(game.id);
    } catch (err) {
      setError('Failed to create game');
      console.error('Error creating game:', err);
    } finally {
      setCreatingGame(false);
    }
  };

  const joinExistingGame = async (gameId: number, asObserver: boolean = false) => {
    try {
      setError('');
      
      if (asObserver) {
        await apiService.observeGame(gameId);
      } else {
        await apiService.joinGame(gameId);
      }
      
      onJoinGame(gameId);
    } catch (err) {
      setError('Failed to join game');
      console.error('Error joining game:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Game Lobby
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Create New Game Section */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Start New Game</h4>
            <div className="flex space-x-4">
              <button
                onClick={() => createNewGame('human')}
                disabled={creatingGame}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {creatingGame ? 'Creating...' : 'vs Human'}
              </button>
              <button
                onClick={() => createNewGame('ai')}
                disabled={creatingGame}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {creatingGame ? 'Creating...' : 'vs Computer'}
              </button>
            </div>
          </div>

          {/* Active Games List */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Active Games</h4>
            
            {games.length === 0 ? (
              <p className="text-gray-500">No active games. Create one to get started!</p>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Players
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Observers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {games.map((game) => (
                      <tr key={game.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{game.player1_username}</div>
                            <div className="text-gray-500">
                              vs {game.player2_username || (game.player2_type === 'ai' ? 'Computer' : 'Waiting...')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            game.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                            game.status === 'in_progress' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {game.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(game.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {game.observer_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {game.status === 'waiting' && game.player1_username !== user?.username && (
                            <button
                              onClick={() => joinExistingGame(game.id, false)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Join
                            </button>
                          )}
                          {game.status === 'in_progress' && (
                            <button
                              onClick={() => joinExistingGame(game.id, true)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Watch
                            </button>
                          )}
                          {(game.player1_username === user?.username || game.player2_username === user?.username) && (
                            <button
                              onClick={() => onJoinGame(game.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Resume
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={loadGames}
              className="text-indigo-600 hover:text-indigo-500 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
