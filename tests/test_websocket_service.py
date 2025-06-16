import json
from unittest.mock import AsyncMock, Mock

import pytest
from fastapi import WebSocket

from app.models.game import WebSocketMessage
from app.services.redis_service import RedisManager
from app.services.websocket_service import WebSocketManager


@pytest.fixture
def mock_redis_manager():
    """Mock Redis manager for testing"""
    redis_manager = Mock(spec=RedisManager)
    redis_manager.add_user_connection = AsyncMock()
    redis_manager.remove_user_connection = AsyncMock()
    redis_manager.get_game_observers = AsyncMock(return_value=[1, 2, 3])
    redis_manager.add_game_observer = AsyncMock()
    redis_manager.remove_game_observer = AsyncMock()
    return redis_manager


@pytest.fixture
def websocket_manager(mock_redis_manager):
    """Create WebSocket manager with mocked Redis"""
    return WebSocketManager(redis_manager=mock_redis_manager)


@pytest.fixture
def mock_websocket():
    """Mock WebSocket connection"""
    websocket = Mock(spec=WebSocket)
    websocket.accept = AsyncMock()
    websocket.send_text = AsyncMock()
    return websocket


class TestWebSocketManager:
    """Test WebSocket manager functionality"""

    @pytest.mark.asyncio
    async def test_connect(self, websocket_manager, mock_websocket, mock_redis_manager):
        """Test WebSocket connection"""
        user_id = 1

        await websocket_manager.connect(mock_websocket, user_id)

        # Check that websocket was accepted
        mock_websocket.accept.assert_called_once()

        # Check that connection was stored
        assert user_id in websocket_manager.user_connections
        connection_id = websocket_manager.user_connections[user_id]
        assert connection_id in websocket_manager.active_connections
        assert websocket_manager.active_connections[connection_id] == mock_websocket

        # Check Redis call
        mock_redis_manager.add_user_connection.assert_called_once_with(
            user_id, connection_id
        )

    @pytest.mark.asyncio
    async def test_disconnect(
        self, websocket_manager, mock_websocket, mock_redis_manager
    ):
        """Test WebSocket disconnection"""
        user_id = 1

        # Connect first
        await websocket_manager.connect(mock_websocket, user_id)
        connection_id = websocket_manager.user_connections[user_id]

        # Disconnect
        await websocket_manager.disconnect(user_id)

        # Check that connection was removed
        assert user_id not in websocket_manager.user_connections
        assert connection_id not in websocket_manager.active_connections

        # Check Redis call
        mock_redis_manager.remove_user_connection.assert_called_with(
            user_id, connection_id
        )

    @pytest.mark.asyncio
    async def test_send_personal_message_success(
        self, websocket_manager, mock_websocket
    ):
        """Test sending personal message successfully"""
        user_id = 1
        message = {"type": "test", "data": "hello"}

        # Connect user
        await websocket_manager.connect(mock_websocket, user_id)

        # Send message
        await websocket_manager.send_personal_message(message, user_id)

        # Check that message was sent
        mock_websocket.send_text.assert_called_once_with(json.dumps(message))

    @pytest.mark.asyncio
    async def test_send_personal_message_user_not_connected(self, websocket_manager):
        """Test sending message to non-connected user"""
        user_id = 999
        message = {"type": "test", "data": "hello"}

        # Should not raise an exception
        await websocket_manager.send_personal_message(message, user_id)

    @pytest.mark.asyncio
    async def test_send_personal_message_exception_handling(
        self, websocket_manager, mock_websocket
    ):
        """Test handling exception during message sending"""
        user_id = 1
        message = {"type": "test", "data": "hello"}

        # Connect user
        await websocket_manager.connect(mock_websocket, user_id)

        # Mock websocket to raise exception
        mock_websocket.send_text.side_effect = Exception("Connection lost")

        # Send message (should handle exception and disconnect)
        await websocket_manager.send_personal_message(message, user_id)

        # Check that user was disconnected
        assert user_id not in websocket_manager.user_connections

    @pytest.mark.asyncio
    async def test_broadcast_to_game(
        self, websocket_manager, mock_websocket, mock_redis_manager
    ):
        """Test broadcasting to game observers"""
        game_id = 1
        message = {"type": "game_update", "data": "test"}

        # Mock observers
        observers = [1, 2, 3]
        mock_redis_manager.get_game_observers.return_value = observers

        # Connect some users
        mock_websocket2 = Mock(spec=WebSocket)
        mock_websocket2.send_text = AsyncMock()

        await websocket_manager.connect(mock_websocket, 1)
        await websocket_manager.connect(mock_websocket2, 2)

        # Broadcast to game
        await websocket_manager.broadcast_to_game(message, game_id)

        # Check Redis call
        mock_redis_manager.get_game_observers.assert_called_once_with(game_id)

        # Check that connected users received message
        mock_websocket.send_text.assert_called_with(json.dumps(message))
        mock_websocket2.send_text.assert_called_with(json.dumps(message))

    @pytest.mark.asyncio
    async def test_broadcast_to_all(self, websocket_manager, mock_websocket):
        """Test broadcasting to all connected users"""
        message = {"type": "global_update", "data": "test"}

        # Connect multiple users
        mock_websocket2 = Mock(spec=WebSocket)
        mock_websocket2.send_text = AsyncMock()

        await websocket_manager.connect(mock_websocket, 1)
        await websocket_manager.connect(mock_websocket2, 2)

        # Broadcast to all
        await websocket_manager.broadcast_to_all(message)

        # Check that all users received message
        mock_websocket.send_text.assert_called_with(json.dumps(message))
        mock_websocket2.send_text.assert_called_with(json.dumps(message))

    @pytest.mark.asyncio
    async def test_handle_message_join_game(
        self, websocket_manager, mock_redis_manager
    ):
        """Test handling join game message"""
        user_id = 1
        message = WebSocketMessage(type="join_game", data={"game_id": 123})

        await websocket_manager.handle_message(user_id, message)

        # Check Redis call
        mock_redis_manager.add_game_observer.assert_called_once_with(123, user_id)

    @pytest.mark.asyncio
    async def test_handle_message_leave_game(
        self, websocket_manager, mock_redis_manager
    ):
        """Test handling leave game message"""
        user_id = 1
        message = WebSocketMessage(type="leave_game", data={"game_id": 123})

        await websocket_manager.handle_message(user_id, message)

        # Check Redis call
        mock_redis_manager.remove_game_observer.assert_called_once_with(123, user_id)

    @pytest.mark.asyncio
    async def test_handle_message_game_update(
        self, websocket_manager, mock_redis_manager
    ):
        """Test handling game update message"""
        user_id = 1
        game_data = {"game_id": 123, "board": ["X", "", "", "", "", "", "", "", ""]}
        message = WebSocketMessage(type="game_update", data=game_data)

        await websocket_manager.handle_message(user_id, message)

        # Check Redis call to get observers
        mock_redis_manager.get_game_observers.assert_called_once_with(123)

    @pytest.mark.asyncio
    async def test_handle_message_unknown_type(self, websocket_manager):
        """Test handling unknown message type"""
        user_id = 1
        message = WebSocketMessage(type="unknown_type", data={})

        # Should not raise exception
        await websocket_manager.handle_message(user_id, message)

    @pytest.mark.asyncio
    async def test_notify_game_update(self, websocket_manager, mock_redis_manager):
        """Test notifying game update"""
        game_id = 123
        game_data = {"board": ["X", "", "", "", "", "", "", "", ""]}

        await websocket_manager.notify_game_update(game_id, game_data)

        # Check Redis call
        mock_redis_manager.get_game_observers.assert_called_once_with(game_id)

    @pytest.mark.asyncio
    async def test_notify_games_list_update(self, websocket_manager, mock_websocket):
        """Test notifying games list update"""
        # Connect users
        await websocket_manager.connect(mock_websocket, 1)

        await websocket_manager.notify_games_list_update()

        # Check that message was sent
        expected_message = {"type": "games_list_update", "data": {}}
        mock_websocket.send_text.assert_called_with(json.dumps(expected_message))

    @pytest.mark.asyncio
    async def test_handle_join_game_no_game_id(
        self, websocket_manager, mock_redis_manager
    ):
        """Test handling join game without game_id"""
        user_id = 1

        await websocket_manager._handle_join_game(user_id, {})

        # Should not call Redis
        mock_redis_manager.add_game_observer.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_leave_game_no_game_id(
        self, websocket_manager, mock_redis_manager
    ):
        """Test handling leave game without game_id"""
        user_id = 1

        await websocket_manager._handle_leave_game(user_id, {})

        # Should not call Redis
        mock_redis_manager.remove_game_observer.assert_not_called()

    @pytest.mark.asyncio
    async def test_handle_game_update_no_game_id(
        self, websocket_manager, mock_redis_manager
    ):
        """Test handling game update without game_id"""
        user_id = 1

        await websocket_manager._handle_game_update(user_id, {})

        # Should not call Redis
        mock_redis_manager.get_game_observers.assert_not_called()
