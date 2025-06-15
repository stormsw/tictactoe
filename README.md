# Tic-Tac-Toe Web Application

[![Tests](https://github.com/stormsw/tictactoe/actions/workflows/tests.yml/badge.svg)](https://github.com/stormsw/tictactoe/actions/workflows/tests.yml)
[![Coverage](https://github.com/stormsw/tictactoe/actions/workflows/ci-coverage.yml/badge.svg)](https://github.com/stormsw/tictactoe/actions/workflows/ci-coverage.yml)
[![codecov](https://codecov.io/gh/stormsw/tictactoe/branch/master/graph/badge.svg)](https://codecov.io/gh/stormsw/tictactoe)

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
- **Vitest**: Frontend testing framework with coverage
- **Pre-commit hooks**: Prevent commits with code issues
- **80% backend test coverage**: Enforced minimum coverage
- **30% frontend test coverage**: Enforced minimum coverage

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

## Development Workflow & Debugging

### Code Quality & Pre-commit Hooks

This project uses pre-commit hooks to maintain code quality:

```bash
# Pre-commit hooks automatically run on every commit:
# ✅ ruff-check      - Python linting
# ✅ ruff-format     - Python code formatting
# ✅ pytest-coverage - Python tests (80% coverage required)
# ✅ eslint-check    - Frontend TypeScript/React linting
# ✅ vitest-coverage - Frontend tests (30% coverage required)

# Run all hooks manually:
pre-commit run --all-files

# Run specific hook:
pre-commit run ruff-check
pre-commit run vitest-coverage
```

### Frontend Testing

The project includes comprehensive frontend testing with Vitest:

#### Vitest Coverage Pre-commit Hook

The `vitest-coverage` pre-commit hook ensures frontend test coverage meets quality standards:

```yaml
# .pre-commit-config.yaml
- id: vitest-coverage
  name: vitest-coverage
  entry: bash -c 'cd public && npx vitest run --coverage'
  language: system
  files: ^public/.*\.(js|jsx|ts|tsx)$
  require_serial: true
```

**Key Features:**

- **Non-interactive mode**: Uses `vitest run` to prevent hanging in CI/pre-commit
- **Coverage enforcement**: Requires minimum 30% frontend coverage
- **Automatic execution**: Runs on every commit that touches frontend files
- **Parallel safety**: Uses `require_serial: true` to prevent conflicts

#### Running Frontend Tests

```bash
# Quick test run (used by pre-commit hook):
cd public && npx vitest run --coverage

# Development workflow:
cd public
npm run test                       # Interactive watch mode
npm run test:coverage              # Coverage report with watch
npm run test:coverage -- --run     # One-time coverage report
npm run test:ui                    # Visual UI for tests

# Test specific files:
npx vitest run src/__tests__/LoginForm.test.tsx
npx vitest run src/__tests__/apiService.test.ts
```

#### Coverage Requirements

- **Minimum Coverage**: 30% overall frontend coverage
- **Covered Components**: LoginForm, Navigation, API services, utility functions
- **Test Types**: Unit tests, component tests, integration tests
- **Reports**: HTML coverage reports generated in `public/coverage/`

#### Test Structure

```
public/src/__tests__/
├── LoginForm.test.tsx        # Component testing (form interactions)
├── Navigation.test.tsx       # Component testing (navigation logic)
├── apiService.test.ts        # API service testing (HTTP calls)
├── useAuthStore.test.ts      # Hook testing (Zustand store)
├── helpers.test.ts           # Utility function testing
└── utilityHelpers.test.ts    # Additional helper functions
```

#### Troubleshooting Frontend Tests

**Pre-commit hook hanging:**

```bash
# Fixed: Was using 'vitest' instead of 'vitest run'
# vitest runs in watch mode by default, causing pre-commit to hang
# Solution: Always use 'vitest run' for non-interactive execution
```

**Coverage below 30%:**

```bash
# Check current coverage:
cd public && npx vitest run --coverage

# Add more tests to increase coverage:
# Focus on: components, services, hooks, utilities
```

**Mock setup issues:**

```bash
# Ensure proper mocking in test files:
vi.mock('../services/api', () => ({
    default: {
        login: vi.fn(),
        setAuthToken: vi.fn(),
    },
}));
```

### VS Code Debugging Setup

Complete VS Code debugging configuration is provided:

1. **Container Debugging**: Debug the FastAPI backend running in Docker
2. **Local Debugging**: Debug Python code running locally
3. **Frontend Debugging**: Debug React components and TypeScript

**Available debug configurations:**

- `Python: Debug Backend (Container)` - Attach to running Docker container
- `Python: Debug Backend (Local)` - Debug local Python process
- `TypeScript: Debug Frontend` - Debug React app in Chrome

**VS Code Tasks:**

- `Start Debug Container` - Launch containers with debugpy
- `Stop Debug Container` - Stop all containers
- `Build Backend (Debug)` - Rebuild backend with debug support
- `View Backend Logs` - Monitor backend container logs

### Development Environment

**Hot Reload Setup:**

```bash
# Start development environment with hot reload:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Backend: Automatic reload via uvicorn --reload
# Frontend: Automatic reload via Vite HMR
# Database: Persistent volumes for data
```

**Port Configuration:**

- `3000` - Frontend development server (Vite)
- `8000` - Backend API (FastAPI)
- `8080` - Production preview (Nginx)
- `5432` - PostgreSQL database
- `6379` - Redis cache
- `5678` - Python debugger (debugpy)

**Volume Mounting:**

- `./app:/app/app:rw` - Backend source code
- `./public:/app/public:rw` - Frontend source code
- Database and Redis data persist in Docker volumes

### Debugging Workflow

1. **Set breakpoints** in VS Code
2. **Start debug container**: `Ctrl+Shift+P` → `Tasks: Run Task` → `Start Debug Container`
3. **Attach debugger**: `F5` → Select debug configuration
4. **Make requests** to trigger breakpoints
5. **Inspect variables** and step through code

### Testing Strategy

**Backend Testing (80% coverage required):**

```bash
# Run specific test files:
pytest tests/test_ai_service.py -v
pytest tests/test_game_logic.py -v

# Run with coverage:
pytest --cov=app --cov-report=html
# View coverage: open htmlcov/index.html
```

**Frontend Testing (30% coverage required):**

```bash
# Test specific components:
cd public
npm test -- --run src/__tests__/Navigation.test.tsx
npm test -- --run src/__tests__/helpers.test.ts

# Coverage report:
npm run test:coverage -- --run
# View coverage: open public/coverage/index.html

# Current coverage: 30.71% (exceeds requirement)
```

**Pre-commit Testing:**

```bash
# Automatically runs on commit:
# - Backend: pytest with 80% coverage minimum
# - Frontend: vitest with 30% coverage minimum
# - Linting: ruff (Python) + eslint (TypeScript)

# Manual execution:
pre-commit run --all-files
```

**Integration Testing:**

```bash
# Test Docker setup:
./test-docker.sh

# Test authentication:
python test_auth.py
```

### Common Development Issues

**"Failed to load games" error:**

- ✅ Fixed: Enum mismatch in database queries
- Games endpoint now uses string values instead of enum names

**Pre-commit hooks failing:**

- Python issues: Check `uv` virtual environment activation
- Frontend issues: Run `cd public && npx vitest run --coverage` to test manually
- Coverage issues: Ensure tests cover 30% frontend and 80% backend coverage

**Docker debugging not working:**

- Ensure debugpy port (5678) is exposed
- Check volume mounts are correct
- Verify containers are running: `docker ps`

## 📊 Coverage & CI/CD

This project includes comprehensive automated testing and coverage reporting:

- **Automated Tests**: Run on every push and pull request
- **Coverage Reports**: Generated for both backend (Python) and frontend (TypeScript)
- **GitHub Pages**: Coverage reports automatically deployed to GitHub Pages
- **Codecov Integration**: Track coverage trends and get PR feedback

For detailed setup instructions and troubleshooting, see [COVERAGE.md](COVERAGE.md).

### Quick Coverage Commands

```bash
# Backend coverage
uv run pytest --cov=app --cov-report=html
open htmlcov/index.html

# Frontend coverage
cd public && npm run test:coverage
open coverage/index.html
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass and coverage meets requirements (80% backend, 30% frontend)
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.# Test commit
