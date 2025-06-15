from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio

from app.services.redis_service import RedisManager
from app.services.websocket_service import WebSocketManager


class TestRedisIntegration:
    """Test Redis integration with WebSocket manager"""

    @pytest_asyncio.fixture
    async def redis_manager(self):
        """Create a mock Redis manager for testing"""
        with patch("app.services.redis_service.redis") as mock_redis:
            # Mock Redis client
            mock_client = AsyncMock()
            mock_redis.from_url.return_value = mock_client

            # Mock Redis methods
            mock_client.setex = AsyncMock()
            mock_client.get = AsyncMock()
            mock_client.delete = AsyncMock()
            mock_client.sadd = AsyncMock()
            mock_client.srem = AsyncMock()
            mock_client.smembers = AsyncMock()
            mock_client.expire = AsyncMock()
            mock_client.incr = AsyncMock()
            mock_client.close = AsyncMock()

            manager = RedisManager()
            manager.redis = mock_client
            yield manager

    @pytest_asyncio.fixture
    async def websocket_manager(self, redis_manager):
        """Create WebSocket manager with Redis"""
        return WebSocketManager(redis_manager)

    @pytest.mark.asyncio
    async def test_session_management(self, redis_manager):
        """Test session storage and retrieval"""
        # Test storing session
        user_data = {"user_id": 1, "username": "testuser"}
        await redis_manager.store_session("test_token", user_data, 1800)

        redis_manager.redis.setex.assert_called_once()
        call_args = redis_manager.redis.setex.call_args
        assert call_args[0][0] == "session:test_token"
        assert call_args[0][1] == 1800

        # Test getting session
        redis_manager.redis.get.return_value = '{"user_id": 1, "username": "testuser"}'
        result = await redis_manager.get_session("test_token")

        redis_manager.redis.get.assert_called_with("session:test_token")
        assert result == user_data

    @pytest.mark.asyncio
    async def test_websocket_connection_tracking(self, redis_manager):
        """Test WebSocket connection tracking in Redis"""
        user_id = 1
        connection_id = "conn_123"

        # Test adding connection
        await redis_manager.add_user_connection(user_id, connection_id)

        redis_manager.redis.sadd.assert_called_with("connections:1", connection_id)
        redis_manager.redis.expire.assert_called_with("connections:1", 3600)

        # Test getting connections
        redis_manager.redis.smembers.return_value = {connection_id}
        connections = await redis_manager.get_user_connections(user_id)

        assert connections == {connection_id}

    @pytest.mark.asyncio
    async def test_game_observers_tracking(self, redis_manager):
        """Test game observers tracking in Redis"""
        game_id = 1
        user_id = 2

        # Test adding observer
        await redis_manager.add_game_observer(game_id, user_id)

        redis_manager.redis.sadd.assert_called_with("game_observers:1", "2")
        redis_manager.redis.expire.assert_called_with("game_observers:1", 86400)

        # Test getting observers
        redis_manager.redis.smembers.return_value = {"2", "3"}
        observers = await redis_manager.get_game_observers(game_id)

        assert observers == {2, 3}

    @pytest.mark.asyncio
    async def test_rate_limiting(self, redis_manager):
        """Test rate limiting functionality"""
        user_id = 1
        action = "make_move"

        # Test first request (should be allowed)
        redis_manager.redis.get.return_value = None
        result = await redis_manager.check_rate_limit(
            user_id, action, limit=5, window_seconds=60
        )

        assert result is True
        redis_manager.redis.setex.assert_called_with("rate_limit:1:make_move", 60, 1)

        # Test request within limit
        redis_manager.redis.get.return_value = "3"
        result = await redis_manager.check_rate_limit(
            user_id, action, limit=5, window_seconds=60
        )

        assert result is True
        redis_manager.redis.incr.assert_called_with("rate_limit:1:make_move")

        # Test request exceeding limit
        redis_manager.redis.get.return_value = "5"
        result = await redis_manager.check_rate_limit(
            user_id, action, limit=5, window_seconds=60
        )

        assert result is False

    @pytest.mark.asyncio
    async def test_game_state_caching(self, redis_manager):
        """Test game state caching"""
        game_id = 1
        game_data = {
            "id": 1,
            "board_state": '["X","","O","","","","","",""]',
            "status": "in_progress",
        }

        # Test caching game state
        await redis_manager.cache_game_state(game_id, game_data, 3600)

        redis_manager.redis.setex.assert_called_once()
        call_args = redis_manager.redis.setex.call_args
        assert call_args[0][0] == "game_state:1"
        assert call_args[0][1] == 3600

        # Test retrieving cached game state
        redis_manager.redis.get.return_value = '{"id": 1, "board_state": "[\\"X\\",\\"\\",\\"O\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\"]", "status": "in_progress"}'
        result = await redis_manager.get_cached_game_state(game_id)

        redis_manager.redis.get.assert_called_with("game_state:1")
        assert result["id"] == 1
        assert result["status"] == "in_progress"

    @pytest.mark.asyncio
    async def test_websocket_manager_with_redis(self, websocket_manager, redis_manager):
        """Test WebSocket manager integration with Redis"""
        game_id = 1

        # Mock Redis responses
        redis_manager.redis.smembers.return_value = {"2", "3"}

        # Test broadcasting to game (should use Redis to get observers)
        message = {"type": "game_update", "data": {"game_id": 1}}

        # Since we don't have actual WebSocket connections in this test,
        # we'll just verify that Redis is called correctly
        await websocket_manager.broadcast_to_game(message, game_id)

        # Verify Redis was called to get observers
        redis_manager.redis.smembers.assert_called_with("game_observers:1")


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
