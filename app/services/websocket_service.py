import json
import uuid

from fastapi import WebSocket

from app.models.game import WebSocketMessage
from app.services.redis_service import RedisManager


class WebSocketManager:
    """Manages WebSocket connections for real-time game updates"""

    def __init__(self, redis_manager: RedisManager = None):
        # Active connections: connection_id -> websocket
        self.active_connections: dict[str, WebSocket] = {}
        # Connection mapping: user_id -> connection_id
        self.user_connections: dict[int, str] = {}
        # Redis manager for persistent data
        self.redis_manager = redis_manager or RedisManager()

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept WebSocket connection"""
        await websocket.accept()
        connection_id = str(uuid.uuid4())

        # Store connection
        self.active_connections[connection_id] = websocket
        self.user_connections[user_id] = connection_id

        # Track connection in Redis
        await self.redis_manager.add_user_connection(user_id, connection_id)

        print(f"User {user_id} connected via WebSocket with connection {connection_id}")

    async def disconnect(self, user_id: int):
        """Remove WebSocket connection"""
        if user_id in self.user_connections:
            connection_id = self.user_connections[user_id]

            # Remove from local storage
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
            del self.user_connections[user_id]

            # Remove from Redis
            await self.redis_manager.remove_user_connection(user_id, connection_id)

            print(f"User {user_id} disconnected from WebSocket")

    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user"""
        if user_id in self.user_connections:
            connection_id = self.user_connections[user_id]
            if connection_id in self.active_connections:
                try:
                    await self.active_connections[connection_id].send_text(
                        json.dumps(message)
                    )
                except Exception as e:
                    print(f"Error sending message to user {user_id}: {e}")
                    await self.disconnect(user_id)

    async def broadcast_to_game(self, message: dict, game_id: int):
        """Broadcast message to all users in a game"""
        # Get observers from Redis
        observers = await self.redis_manager.get_game_observers(game_id)
        for user_id in observers:
            await self.send_personal_message(message, user_id)

    async def broadcast_to_all(self, message: dict):
        """Broadcast message to all connected users"""
        for user_id in list(self.user_connections.keys()):
            await self.send_personal_message(message, user_id)

    async def handle_message(self, user_id: int, message: WebSocketMessage):
        """Handle incoming WebSocket message"""
        message_type = message.type
        data = message.data

        if message_type == "join_game":
            await self._handle_join_game(user_id, data)
        elif message_type == "leave_game":
            await self._handle_leave_game(user_id, data)
        elif message_type == "game_update":
            await self._handle_game_update(user_id, data)
        else:
            print(f"Unknown message type: {message_type}")

    async def _handle_join_game(self, user_id: int, data: dict):
        """Handle user joining a game"""
        game_id = data.get("game_id")
        if not game_id:
            return

        # Add user to game observers in Redis
        await self.redis_manager.add_game_observer(game_id, user_id)

        # Notify other players
        await self.broadcast_to_game(
            {"type": "player_joined", "data": {"game_id": game_id, "user_id": user_id}},
            game_id,
        )

    async def _handle_leave_game(self, user_id: int, data: dict):
        """Handle user leaving a game"""
        game_id = data.get("game_id")
        if not game_id:
            return

        # Remove user from game observers in Redis
        await self.redis_manager.remove_game_observer(game_id, user_id)

        # Notify other players
        await self.broadcast_to_game(
            {"type": "player_left", "data": {"game_id": game_id, "user_id": user_id}},
            game_id,
        )

    async def _handle_game_update(self, user_id: int, data: dict):
        """Handle game state update"""
        _ = user_id  # Parameter kept for interface consistency
        game_id = data.get("game_id")
        if not game_id:
            return

        # Broadcast game update to all observers
        await self.broadcast_to_game({"type": "game_update", "data": data}, game_id)

    async def notify_game_update(self, game_id: int, game_data: dict):
        """Notify all observers of a game update"""
        await self.broadcast_to_game(
            {"type": "game_update", "data": {"game_id": game_id, "game": game_data}},
            game_id,
        )

    async def notify_games_list_update(self):
        """Notify all users that the games list has been updated"""
        await self.broadcast_to_all({"type": "games_list_update", "data": {}})
