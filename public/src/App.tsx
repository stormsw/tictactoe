import { useState, useEffect } from 'react';
import { useAuthStore } from './hooks/useAuthStore';
import { useWebSocket } from './hooks/useWebSocket';
import LoginForm from './components/Auth/LoginForm';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';
import Navigation from './components/Navigation';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [currentView, setCurrentView] = useState<'lobby' | 'game' | 'leaderboard'>('lobby');
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);

  // Initialize WebSocket connection when authenticated
  const { isConnected } = useWebSocket(user?.id ?? null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Tic-Tac-Toe Game
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sign in to start playing
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  const handleJoinGame = (gameId: number) => {
    setCurrentGameId(gameId);
    setCurrentView('game');
  };

  const handleLeaveGame = () => {
    setCurrentGameId(null);
    setCurrentView('lobby');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        user={user}
        isConnected={isConnected}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === 'lobby' && (
            <GameLobby onJoinGame={handleJoinGame} />
          )}
          
          {currentView === 'game' && currentGameId && (
            <ErrorBoundary fallback={
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Game Error
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  There was an error loading the game board.
                </p>
                <button
                  onClick={handleLeaveGame}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Back to Lobby
                </button>
              </div>
            }>
              <GameBoard 
                gameId={currentGameId} 
                onLeaveGame={handleLeaveGame}
              />
            </ErrorBoundary>
          )}
          
          {currentView === 'leaderboard' && (
            <Leaderboard />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
