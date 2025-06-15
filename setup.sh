#!/bin/bash

# Tic-Tac-Toe Application Setup Script

echo "🎮 Setting up Tic-Tac-Toe Application..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv (fast Python package manager)..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/env
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
fi

# Install Python dependencies with dev tools (including ruff)
echo "🐍 Installing Python dependencies with uv..."
uv sync --dev --all-extras

# Install pre-commit hooks
echo "🔗 Installing pre-commit hooks..."
uv run pre-commit install

# Set up frontend
echo "⚛️ Setting up frontend..."
cd public
npm install
echo "🔍 Running TypeScript type check..."
npm run type-check
echo "📋 ESLint configuration available (run 'npm run lint' manually if needed)"
cd ..

# Run Python linting
echo "🧹 Running Python linting with ruff..."
uv run ruff check .
echo "🎨 Running Python formatting check with ruff..."
uv run ruff format --check .

echo "🐳 Deployment Options:"
echo ""
echo "🚀 Production (Recommended):"
echo "   docker compose up -d"
echo "   → Application: http://localhost"
echo ""
echo "🔧 Development with Docker:"
echo "   docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d"
echo "   → Frontend dev: http://localhost:3000"
echo "   → Production preview: http://localhost:8080"
echo "   → Backend direct: http://localhost:8000"
echo ""
echo "💻 Local development:"
echo "   1. Start services: docker compose up database redis -d"
echo "   2. Start backend: uvicorn main:app --reload"
echo "   3. Start frontend: cd public && npm run dev"
echo ""
echo "📚 Documentation:"
echo "   - API Docs: http://localhost/api/docs (production)"
echo "   - API Docs: http://localhost:8000/docs (development)"
echo ""
echo "✨ Setup complete! Happy coding!"
