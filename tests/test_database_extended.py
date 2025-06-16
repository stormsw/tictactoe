import datetime
import os
from unittest.mock import patch

from app.models.game import GameResponse


class TestDatabaseConnection:
    """Test database connection setup"""

    def test_database_url_default(self):
        """Test default database URL"""
        with patch.dict(os.environ, {}, clear=True):
            # Remove DATABASE_URL from environment
            # Force reload to test default
            import importlib

            from app.database import connection

            importlib.reload(connection)
            assert connection.DATABASE_URL == "sqlite:///./tictactoe.db"

    def test_non_sqlite_engine_creation(self):
        """Test engine creation for non-SQLite databases"""
        with patch.dict(os.environ, {"DATABASE_URL": "postgresql://test"}):
            import importlib

            from app.database import connection

            importlib.reload(connection)
            # This tests the else branch in the engine creation


class TestGameModels:
    """Test game model methods"""

    def test_game_response_from_orm_with_none_board(self):
        """Test GameResponse.from_orm with None board_state"""
        # Create a mock game object with None board_state

        mock_game = type(
            "MockGame",
            (),
            {
                "id": 1,
                "player1_id": 1,
                "player2_id": 2,
                "player2_type": "human",
                "board_state": None,  # This should trigger the else branch
                "current_turn": "1",
                "status": "in_progress",
                "winner_id": None,
                "total_moves": 0,
                "created_at": datetime.datetime.now(),
                "updated_at": None,
                "completed_at": None,
            },
        )()

        response = GameResponse.from_orm(mock_game)
        assert response.board_state == [""] * 9

    def test_game_response_from_orm_with_board_state(self):
        """Test GameResponse.from_orm with existing board_state"""
        import json

        board_state = ["X", "O", "", "", "", "", "", "", ""]

        mock_game = type(
            "MockGame",
            (),
            {
                "id": 1,
                "player1_id": 1,
                "player2_id": 2,
                "player2_type": "human",
                "board_state": json.dumps(board_state),
                "current_turn": "1",
                "status": "in_progress",
                "winner_id": None,
                "total_moves": 2,
                "created_at": datetime.datetime.now(),
                "updated_at": None,
                "completed_at": None,
            },
        )()

        response = GameResponse.from_orm(mock_game)
        assert response.board_state == board_state
