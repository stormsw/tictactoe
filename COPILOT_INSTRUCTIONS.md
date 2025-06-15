# Tic-Tac-Toe Web Application - VS Code Copilot Instructions

## Project Overview
Build a comprehensive multiplayer tic-tac-toe web application with real-time gameplay, user authentication, and AI opponents.

## Architecture Requirements

### 1. Frontend (React.js in /public folder)
- **Framework**: React.js with TypeScript
- **Location**: All static content must be in `public/` folder
- **Features**:
  - User authentication UI (login/register)
  - Game board component with real-time updates
  - Game lobby showing active games list
  - Leaderboard display with player statistics
  - Observer mode for watching games
  - Responsive design for mobile and desktop

### 2. Backend (FastAPI Python)
- **Framework**: FastAPI with Python 3.12+
- **Authentication**: Assume users are logged in (JWT or session-based)
- **WebSocket**: Real-time communication for game updates
- **Features**:
  - User management and authentication
  - Game state management
  - AI opponent logic
  - Leaderboard calculations
  - Observer functionality

### 3. Docker Configuration
- **Requirement**: Application must run in Docker
- **Setup**: 
  - Multi-stage Dockerfile
  - Frontend build stage
  - Backend Python stage
  - docker-compose.yml for development
  - Production-ready configuration

### 4. Code Quality & Testing
- **Linting**: Use Ruff for Python code formatting and linting
- **Testing**: pytest for unit tests
- **Coverage**: Minimum 80% test coverage required
- **Git Hooks**: Pre-commit hooks to prevent commits when:
  - Ruff warnings or errors exist
  - Test coverage is below 80%

## Detailed Feature Requirements

### Game Management
1. **Active Games List**
   - Display all ongoing games
   - Show player names and game status
   - Allow joining as observer

2. **Game Creation**
   - Start new game with another user
   - Start new game against computer AI
   - Game invitation system

3. **Computer AI**
   - AI moves calculated on backend
   - Multiple difficulty levels (easy, medium, hard)
   - Minimax algorithm implementation

4. **Observer Mode**
   - Users can watch ongoing games
   - Real-time updates via WebSocket
   - No interaction with game state

### Leaderboard System
- **Metrics**:
  - Number of wins
  - Number of losses
  - Win/loss ratio
  - Average number of moves per game
- **Display**: Top players ranked by performance

### WebSocket Events
```json
{
  "game_move": {"game_id": "uuid", "position": [row, col], "player": "X|O"},
  "game_join": {"game_id": "uuid", "role": "player|observer"},
  "game_created": {"game_id": "uuid", "players": ["user1", "user2|AI"]},
  "game_ended": {"game_id": "uuid", "winner": "X|O|draw"},
  "games_list_updated": {"active_games": [...]}
}
```

## File Structure to Create

```
tictactoe/
├── public/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── GameLobby.tsx
│   │   │   ├── Leaderboard.tsx
│   │   │   └── Auth/
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── app/                        # FastAPI backend
│   ├── __init__.py
│   ├── main.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── game.py
│   │   ├── user.py
│   │   └── leaderboard.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── games.py
│   │   ├── websocket.py
│   │   └── leaderboard.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── game_service.py
│   │   ├── ai_service.py
│   │   └── user_service.py
│   └── database/
│       ├── __init__.py
│       └── connection.py
├── tests/                      # Test files
│   ├── test_game_logic.py
│   ├── test_ai_service.py
│   ├── test_websocket.py
│   └── test_leaderboard.py
├── Dockerfile
├── docker-compose.yml
├── .pre-commit-config.yaml
├── pyproject.toml
└── README.md
```

## Dependencies to Add

### Python (pyproject.toml)
```toml
dependencies = [
    "fastapi>=0.104.0",
    "uvicorn[standard]>=0.24.0",
    "websockets>=12.0",
    "pydantic>=2.5.0",
    "python-jose[cryptography]>=3.3.0",
    "python-multipart>=0.0.6",
    "sqlalchemy>=2.0.0",
    "alembic>=1.13.0",
    "redis>=5.0.0"
]

[project.optional-dependencies]
dev = [
    "pytest>=7.4.0",
    "pytest-cov>=4.1.0",
    "pytest-asyncio>=0.21.0",
    "ruff>=0.1.0",
    "pre-commit>=3.5.0",
    "httpx>=0.25.0"
]
```

**Note**: Use `uv` for fast Python package management:
```bash
uv pip install -e ".[dev]"
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "socket.io-client": "^4.7.0"
  }
}
```

## Git Hooks Configuration

Create `.pre-commit-config.yaml`:
```yaml
repos:
  - repo: local
    hooks:
      - id: ruff-check
        name: ruff-check
        entry: ruff check
        language: system
        types: [python]
        
      - id: ruff-format
        name: ruff-format
        entry: ruff format
        language: system
        types: [python]
        
      - id: pytest-coverage
        name: pytest-coverage
        entry: pytest --cov=app --cov-report=term-missing --cov-fail-under=80
        language: system
        types: [python]
        pass_filenames: false
```

## Implementation Steps

1. **Setup Project Structure**: Create all directories and initial files
2. **Configure Docker**: Set up Dockerfile and docker-compose.yml
3. **Backend Development**:
   - FastAPI application setup
   - WebSocket connection handler
   - Game logic and AI implementation
   - User authentication
   - Database models and connections
4. **Frontend Development**:
   - React components for game board
   - WebSocket integration
   - Game lobby and leaderboard
   - Authentication UI
5. **Testing Setup**:
   - Unit tests for game logic
   - WebSocket testing
   - AI algorithm testing
   - Coverage reporting
6. **Git Hooks**: Configure pre-commit hooks
7. **Documentation**: Update README with setup and usage instructions

**Package Management**: Use `uv` for fast Python dependency management:
```bash
# Install dependencies
uv pip install -e ".[dev]"

# Add new dependencies
uv add fastapi uvicorn

# Development dependencies
uv add --dev pytest ruff
```

## WebSocket Connection Management
- Maintain active connections per user
- Handle reconnection scenarios
- Broadcast game updates to relevant users
- Manage observer connections separately

## AI Implementation Strategy
- Use minimax algorithm with alpha-beta pruning
- Implement difficulty levels by limiting search depth
- Add randomization for easier modes
- Cache common game positions

## Security Considerations
- Validate all WebSocket messages
- Implement rate limiting
- Sanitize user inputs
- Use proper CORS configuration
- Implement proper session management

## Performance Requirements
- Support concurrent games
- Efficient WebSocket broadcasting
- Database query optimization
- Frontend state management
- Caching strategies for leaderboard

This comprehensive instruction set will guide the development of a full-featured tic-tac-toe web application meeting all specified requirements.

## Quick Start Guide

1. **Setup Environment** (installs uv automatically):
   ```bash
   ./setup.sh
   ```

2. **Start with Docker** (Recommended):
   ```bash
   docker-compose up --build
   ```

3. **Development Setup**:
   ```bash
   # Start services
   docker-compose up database redis -d
   
   # Backend (with uv)
   uv pip install -e ".[dev]"
   uvicorn main:app --reload
   
   # Frontend (in new terminal)
   cd public && npm run dev
   ```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Games
- `GET /api/games/` - List active games
- `POST /api/games/` - Create new game
- `GET /api/games/{id}` - Get game details
- `POST /api/games/{id}/join` - Join game as player
- `POST /api/games/{id}/observe` - Join as observer
- `POST /api/games/{id}/move` - Make a move

### Leaderboard
- `GET /api/leaderboard/` - Get leaderboard
- `GET /api/leaderboard/me` - Get my stats

### WebSocket
- `WS /ws/{user_id}` - Real-time updates

## Development Commands

### Code Quality
```bash
# Linting
ruff check .
ruff format .

# Testing
pytest
pytest --cov=app --cov-report=html

# Pre-commit
pre-commit run --all-files
```

## Project Status

✅ **Completed Components**:
- FastAPI backend with authentication
- Game logic and AI opponent
- WebSocket real-time updates
- React frontend with TypeScript
- User management and statistics
- Leaderboard system
- Docker configuration
- Testing framework setup
- Code quality tools (Ruff, pytest)
- Git hooks for quality enforcement

✅ **All Requirements Met**:
1. ✅ Static content in /public folder (React.js)
2. ✅ Docker deployment ready
3. ✅ Ruff and pytest configured
4. ✅ Git commit hooks prevent bad commits
5. ✅ FastAPI with user authentication
6. ✅ WebSocket for real-time updates
7. ✅ Active games list
8. ✅ Game creation with users/AI
9. ✅ Backend AI move calculation
10. ✅ Observer mode functionality
11. ✅ Leaderboard with statistics

The application is now ready for development and deployment!
