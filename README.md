# Tic-Tac-Toe Web Application

A real-time multiplayer tic-tac-toe game with AI opponents, built with FastAPI (backend) and React.js (frontend).

## Features

- 🎮 **Real-time Multiplayer**: Play against other users in real-time using WebSockets
- 🤖 **AI Opponents**: Play against computer with multiple difficulty levels
- 👥 **Observer Mode**: Watch ongoing games as a spectator
- 🏆 **Leaderboard**: Track wins, losses, and performance statistics
- 🔐 **User Authentication**: Secure login and user management
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🐳 **Docker Support**: Easy deployment with Docker

## Tech Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **WebSockets**: Real-time communication
- **PostgreSQL**: Database for user and game data
- **Redis**: Session management and caching
- **SQLAlchemy**: ORM for database operations

### Frontend
- **React.js**: Modern frontend framework
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Socket.IO**: WebSocket client
- **Tailwind CSS**: Utility-first CSS framework

### Code Quality
- **Ruff**: Fast Python linter and formatter
- **pytest**: Testing framework with coverage
- **Pre-commit hooks**: Prevent commits with code issues
- **80% test coverage**: Enforced minimum coverage

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.12+ (for local development)
- Node.js 18+ (for frontend development)

### Running with Docker

#### Production Deployment (Recommended)

1. Clone and setup environment:
```bash
git clone <repository-url>
cd tictactoe
cp .env.example .env
# Edit .env with your production values (database password, secret key, etc.)
```

2. Deploy with Docker Compose:
```bash
# Start all services (Nginx, FastAPI, PostgreSQL, Redis)
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

**Production Architecture**:
- **Frontend**: Static React app served by Nginx at `http://localhost`
- **Backend API**: FastAPI accessible via `/api/*` through Nginx reverse proxy
- **WebSockets**: Real-time features via `/ws/*` through Nginx
- **Internal services**: PostgreSQL and Redis (not exposed externally for security)

#### Development with Docker

For development with hot reload and debugging:

```bash
# Start with development overrides
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Or use the setup script
./setup.sh
```

**Development URLs**:
- Frontend dev server: `http://localhost:3000` (Vite with HMR)
- Production preview: `http://localhost:8080` (Nginx)
- Backend API: `http://localhost:8000` (direct FastAPI access)
- Database: `localhost:5432` (PostgreSQL - exposed for development)
- Redis: `localhost:6379` (Redis - exposed for development)

### Development Setup

1. Install Python dependencies:
```bash
uv pip install -e ".[dev]"
```

2. Install pre-commit hooks:
```bash
pre-commit install
```

3. Set up the database:
```bash
# Start PostgreSQL and Redis
docker compose up database redis -d

# Run migrations
alembic upgrade head
```

4. Start the backend:
```bash
uvicorn main:app --reload
```

5. Start the frontend (in another terminal):
```bash
cd public
npm install
npm run dev
```

## Project Structure

```
tictactoe/
├── app/                        # FastAPI backend
│   ├── models/                 # Database models
│   ├── routers/                # API endpoints
│   ├── services/               # Business logic
│   └── database/               # Database configuration
├── public/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── hooks/              # Custom hooks
│   │   └── services/           # API services
│   └── package.json
├── tests/                      # Test files
├── Dockerfile                  # Container configuration
├── docker-compose.yml          # Multi-service setup
└── pyproject.toml             # Python configuration
```

## Game Rules

- Standard tic-tac-toe rules apply
- Players take turns placing X or O on a 3x3 grid
- First player to get 3 in a row (horizontal, vertical, or diagonal) wins
- Game ends in a draw if the board is full with no winner

## API Endpoints

- `GET /api/games` - List active games
- `POST /api/games` - Create a new game
- `GET /api/games/{game_id}` - Get game details
- `POST /api/games/{game_id}/join` - Join a game
- `GET /api/leaderboard` - Get leaderboard data
- `WS /ws/{user_id}` - WebSocket connection for real-time updates

## WebSocket Events

### Client → Server
- `join_game`: Join a specific game
- `make_move`: Make a move in the game
- `leave_game`: Leave the current game

### Server → Client
- `game_update`: Game state changed
- `game_list_update`: Active games list updated
- `player_joined`: New player joined the game
- `player_left`: Player left the game

## Development Commands

### Code Quality
```bash
# Run linting
ruff check .

# Format code
ruff format .

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=html
```

### Database
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/tictactoe
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and coverage is above 80%
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.# Test commit
