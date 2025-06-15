class ApiService {
  private baseURL = '/api';
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(username: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Game endpoints
  async getActiveGames() {
    return this.request('/games/');
  }

  async createGame(player2Id?: number, player2Type: 'human' | 'ai' = 'human') {
    return this.request('/games/', {
      method: 'POST',
      body: JSON.stringify({
        player2_id: player2Id,
        player2_type: player2Type,
      }),
    });
  }

  async getGame(gameId: number) {
    return this.request(`/games/${gameId}`);
  }

  async joinGame(gameId: number) {
    return this.request(`/games/${gameId}/join`, {
      method: 'POST',
    });
  }

  async observeGame(gameId: number) {
    return this.request(`/games/${gameId}/observe`, {
      method: 'POST',
    });
  }

  async makeMove(gameId: number, position: number) {
    return this.request(`/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify({ position }),
    });
  }

  // Leaderboard endpoints
  async getLeaderboard(limit: number = 20) {
    return this.request(`/leaderboard/?limit=${limit}`);
  }

  async getUserStats(userId: number) {
    return this.request(`/leaderboard/user/${userId}`);
  }

  async getMyStats() {
    return this.request('/leaderboard/me');
  }
}

const apiService = new ApiService();
export default apiService;
