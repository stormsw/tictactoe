from app.models.game import GameStatus, PlayerType, WebSocketMessage


class TestGameModels:
    """Test game model classes and enums"""

    def test_game_status_enum(self):
        """Test GameStatus enum values"""
        assert GameStatus.WAITING == "waiting"
        assert GameStatus.IN_PROGRESS == "in_progress"
        assert GameStatus.COMPLETED == "completed"

    def test_player_type_enum(self):
        """Test PlayerType enum values"""
        assert PlayerType.HUMAN == "human"
        assert PlayerType.AI == "ai"

    def test_websocket_message_creation(self):
        """Test WebSocketMessage creation"""
        message = WebSocketMessage(type="test", data={"key": "value"})
        assert message.type == "test"
        assert message.data == {"key": "value"}

    def test_websocket_message_with_empty_data(self):
        """Test WebSocketMessage with empty data"""
        message = WebSocketMessage(type="test", data={})
        assert message.type == "test"
        assert message.data == {}

    def test_websocket_message_different_types(self):
        """Test WebSocketMessage with different message types"""
        # Test various message types
        join_msg = WebSocketMessage(type="join_game", data={"game_id": 1})
        assert join_msg.type == "join_game"

        leave_msg = WebSocketMessage(type="leave_game", data={"game_id": 1})
        assert leave_msg.type == "leave_game"

        update_msg = WebSocketMessage(type="game_update", data={"board": []})
        assert update_msg.type == "game_update"
