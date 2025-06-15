export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Game {
  id: string;
  player1_id: string | null;
  player2_id: string | null;
  board: (string | null)[][];
  current_player: string;
  status: 'waiting' | 'in_progress' | 'completed';
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameLobbyItem {
  id: number;
  player1_username: string;
  player2_username?: string;
  player2_type: 'human' | 'ai';
  status: 'waiting' | 'in_progress' | 'completed';
  created_at: string;
  observer_count: number;
}

export interface GameData {
  id: number;
  player1_id: number;
  player2_id?: number;
  player2_type: 'human' | 'ai';
  board_state: string[];
  current_turn: 'X' | 'O';
  status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
  winner_id?: number;
  total_moves: number;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  player1?: User;
  player2?: User;
}

export interface UserStats {
  user_id: number;
  username: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  win_rate: number;
  avg_moves_per_game: number;
  total_moves: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  win_rate: number;
  avg_moves_per_game: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
}

export interface WebSocketMessage {
  type: string;
  data?: any;
}
