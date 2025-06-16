import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import auth, games, leaderboard, websocket
from app.services.redis_service import RedisManager

# Initialize Redis manager
redis_manager = RedisManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # Initialize WebSocket manager with Redis
    websocket.set_websocket_manager(redis_manager)
    yield
    # Shutdown
    await redis_manager.close()


app = FastAPI(
    title="Tic-Tac-Toe API",
    description="Real-time multiplayer tic-tac-toe game with AI opponents",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",  # Production Nginx
        "http://localhost:80",  # Production Nginx explicit port
        "http://localhost:3000",  # Development frontend
        "http://localhost:8000",  # Development backend
        "http://localhost:8080",  # Development Nginx
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(games.router, prefix="/api/games", tags=["games"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

# Serve static files (React frontend)
if os.path.exists("public/dist"):
    app.mount("/", StaticFiles(directory="public/dist", html=True), name="static")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
