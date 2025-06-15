import redis.asyncio as redis
import json
import os
from typing import Optional, Dict, Set
from app.models.game import WebSocketMessage

class RedisManager:
    """Redis manager for caching and session management"""
    
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = redis.from_url(redis_url, decode_responses=True)
    
    async def close(self):
        """Close Redis connection"""
        await self.redis.close()
    
    # Session management
    async def store_session(self, session_token: str, user_data: dict, expire_seconds: int = 1800):
        """Store user session data"""
        await self.redis.setex(f"session:{session_token}", expire_seconds, json.dumps(user_data))
    
    async def get_session(self, session_token: str) -> Optional[dict]:
        """Get user session data"""
        data = await self.redis.get(f"session:{session_token}")
        return json.loads(data) if data else None
    
    async def delete_session(self, session_token: str):
        """Delete user session"""
        await self.redis.delete(f"session:{session_token}")
    
    # WebSocket connection tracking
    async def add_user_connection(self, user_id: int, connection_id: str):
        """Track user WebSocket connection"""
        await self.redis.sadd(f"connections:{user_id}", connection_id)
        await self.redis.expire(f"connections:{user_id}", 3600)  # 1 hour
    
    async def remove_user_connection(self, user_id: int, connection_id: str):
        """Remove user WebSocket connection"""
        await self.redis.srem(f"connections:{user_id}", connection_id)
    
    async def get_user_connections(self, user_id: int) -> Set[str]:
        """Get all connections for a user"""
        connections = await self.redis.smembers(f"connections:{user_id}")
        return set(connections)
    
    # Game observers tracking
    async def add_game_observer(self, game_id: int, user_id: int):
        """Add observer to a game"""
        await self.redis.sadd(f"game_observers:{game_id}", str(user_id))
        await self.redis.expire(f"game_observers:{game_id}", 86400)  # 24 hours
    
    async def remove_game_observer(self, game_id: int, user_id: int):
        """Remove observer from a game"""
        await self.redis.srem(f"game_observers:{game_id}", str(user_id))
    
    async def get_game_observers(self, game_id: int) -> Set[int]:
        """Get all observers for a game"""
        observers = await self.redis.smembers(f"game_observers:{game_id}")
        return {int(user_id) for user_id in observers}
    
    # Game state caching
    async def cache_game_state(self, game_id: int, game_data: dict, expire_seconds: int = 3600):
        """Cache game state for faster access"""
        await self.redis.setex(f"game_state:{game_id}", expire_seconds, json.dumps(game_data))
    
    async def get_cached_game_state(self, game_id: int) -> Optional[dict]:
        """Get cached game state"""
        data = await self.redis.get(f"game_state:{game_id}")
        return json.loads(data) if data else None
    
    async def invalidate_game_cache(self, game_id: int):
        """Remove cached game state"""
        await self.redis.delete(f"game_state:{game_id}")
    
    # Rate limiting
    async def check_rate_limit(self, user_id: int, action: str, limit: int = 10, window_seconds: int = 60) -> bool:
        """Check if user has exceeded rate limit for an action"""
        key = f"rate_limit:{user_id}:{action}"
        current = await self.redis.get(key)
        
        if current is None:
            await self.redis.setex(key, window_seconds, 1)
            return True
        
        if int(current) >= limit:
            return False
        
        await self.redis.incr(key)
        return True
    
    # Active games list caching
    async def cache_active_games(self, games_data: list, expire_seconds: int = 60):
        """Cache active games list"""
        await self.redis.setex("active_games", expire_seconds, json.dumps(games_data))
    
    async def get_cached_active_games(self) -> Optional[list]:
        """Get cached active games list"""
        data = await self.redis.get("active_games")
        return json.loads(data) if data else None
    
    async def invalidate_active_games_cache(self):
        """Invalidate active games cache"""
        await self.redis.delete("active_games")
