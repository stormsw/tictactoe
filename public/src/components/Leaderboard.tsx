import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { LeaderboardEntry, LeaderboardResponse, UserStats } from '../types';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError('');
      setLoading(true);

      // Load leaderboard and user stats in parallel
      const [leaderboardData, userStatsData] = await Promise.all([
        apiService.getLeaderboard(20),
        apiService.getMyStats(),
      ]);

      setLeaderboard((leaderboardData as LeaderboardResponse).entries);
      setUserStats(userStatsData as UserStats);
    } catch (err) {
      setError('Failed to load leaderboard data');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatAverage = (value: number) => {
    return value.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Leaderboard
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* User Stats Card */}
          {userStats && (
            <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
              <h4 className="text-xl font-semibold mb-4">Your Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.games_played}</div>
                  <div className="text-sm opacity-90">Games Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{userStats.games_won}</div>
                  <div className="text-sm opacity-90">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatPercentage(userStats.win_rate)}</div>
                  <div className="text-sm opacity-90">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{formatAverage(userStats.avg_moves_per_game)}</div>
                  <div className="text-sm opacity-90">Avg Moves</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{userStats.games_lost}</div>
                  <div className="text-sm opacity-90">Losses</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{userStats.games_drawn}</div>
                  <div className="text-sm opacity-90">Draws</div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Top Players</h4>
            
            {leaderboard.length === 0 ? (
              <p className="text-gray-500">No leaderboard data available yet. Play some games to see rankings!</p>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Player
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Games
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wins
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Win Rate
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Moves
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboard.map((entry) => (
                      <tr key={entry.user_id} className={entry.username === userStats?.username ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {entry.rank <= 3 && (
                              <span className="mr-2">
                                {entry.rank === 1 && '🥇'}
                                {entry.rank === 2 && '🥈'}
                                {entry.rank === 3 && '🥉'}
                              </span>
                            )}
                            #{entry.rank}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {entry.username}
                                {entry.username === userStats?.username && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {entry.games_played}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          <div>
                            <div className="font-medium text-green-600">{entry.games_won}</div>
                            <div className="text-xs text-gray-500">
                              {entry.games_lost}L / {entry.games_drawn}D
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.win_rate >= 0.7 ? 'bg-green-100 text-green-800' :
                            entry.win_rate >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {formatPercentage(entry.win_rate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {formatAverage(entry.avg_moves_per_game)}
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
              onClick={loadData}
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

export default Leaderboard;
