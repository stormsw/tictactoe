from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.models.game import WebSocketMessage
from app.services.websocket_service import WebSocketManager
from app.services.redis_service import RedisManager
import json
from typing import Dict, Any, Optional

router = APIRouter()

# This will be set by main.py
_redis_manager: Optional[RedisManager] = None
_websocket_manager: Optional[WebSocketManager] = None

def get_websocket_manager() -> WebSocketManager:
    """Get the WebSocket manager instance"""
    if _websocket_manager is None:
        raise RuntimeError("WebSocket manager not initialized")
    return _websocket_manager

def set_websocket_manager(redis_manager: RedisManager):
    """Set the WebSocket manager with Redis dependency"""
    global _websocket_manager, _redis_manager
    _redis_manager = redis_manager
    _websocket_manager = WebSocketManager(redis_manager)

@router.websocket("/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """WebSocket endpoint for real-time game updates"""
    manager = get_websocket_manager()
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            message = WebSocketMessage(**message_data)
            
            # Handle different message types
            await manager.handle_message(user_id, message)
            
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await manager.disconnect(user_id)
