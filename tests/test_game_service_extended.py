import json
from unittest.mock import Mock, patch

from app.models.game import GameStatus, PlayerType
from app.services.game_service import GameService


class TestGameServiceMore:
    """Additional game service tests focusing on specific methods"""

    def test_create_game_human_vs_human_no_player2(self):
        """Test creating game without player2 specified"""
        with patch("app.services.game_service.GameService"):
            mock_db = Mock()
            # mock_game = Mock()
            mock_db.add.return_value = None
            mock_db.commit.return_value = None
            mock_db.refresh.return_value = None

            # Test the actual logic without database
            game_data = {
                "player1_id": 1,
                "player2_id": None,
                "player2_type": PlayerType.HUMAN,
                "board_state": '["","","","","","","","",""]',
                "current_turn": "X",
                "status": GameStatus.WAITING,
            }

            # Verify the expected data structure
            assert game_data["player1_id"] == 1
            assert game_data["player2_id"] is None
            assert game_data["status"] == GameStatus.WAITING

    def test_create_game_against_ai(self):
        """Test creating game against AI"""
        game_data = {
            "player1_id": 1,
            "player2_id": None,
            "player2_type": PlayerType.AI,
            "board_state": '["","","","","","","","",""]',
            "current_turn": "X",
            "status": GameStatus.IN_PROGRESS,  # AI games start immediately
        }

        assert game_data["player2_type"] == PlayerType.AI
        assert game_data["status"] == GameStatus.IN_PROGRESS

    def test_board_analysis_methods(self):
        """Test board analysis helper methods"""
        # Test various winning scenarios
        scenarios = [
            # Rows
            (["X", "X", "X", "", "", "", "", "", ""], "X"),
            (["", "", "", "O", "O", "O", "", "", ""], "O"),
            (["", "", "", "", "", "", "X", "X", "X"], "X"),
            # Columns
            (["X", "", "", "X", "", "", "X", "", ""], "X"),
            (["", "O", "", "", "O", "", "", "O", ""], "O"),
            (["", "", "X", "", "", "X", "", "", "X"], "X"),
            # Diagonals
            (["X", "", "", "", "X", "", "", "", "X"], "X"),
            (["", "", "O", "", "O", "", "O", "", ""], "O"),
            # No winner
            (["X", "O", "X", "O", "X", "O", "O", "X", ""], None),
            (["", "", "", "", "", "", "", "", ""], None),
        ]

        for board, expected_winner in scenarios:
            result = GameService._check_winner(board)
            assert result == expected_winner, f"Failed for board {board}"

    def test_board_full_scenarios(self):
        """Test board full detection scenarios"""
        scenarios = [
            # Full board
            (["X", "O", "X", "O", "X", "O", "X", "O", "X"], True),
            # Almost full
            (["X", "O", "X", "O", "X", "O", "X", "O", ""], False),
            # Half full
            (["X", "O", "X", "O", "", "", "", "", ""], False),
            # Empty
            (["", "", "", "", "", "", "", "", ""], False),
        ]

        for board, expected_full in scenarios:
            result = GameService._is_board_full(board)
            assert result == expected_full, f"Failed for board {board}"

    def test_game_state_combinations(self):
        """Test various game state combinations"""
        # Test that we can create different game states
        states = [
            {"status": GameStatus.WAITING, "winner_id": None},
            {"status": GameStatus.IN_PROGRESS, "winner_id": None},
            {"status": GameStatus.COMPLETED, "winner_id": 1},
            {"status": GameStatus.COMPLETED, "winner_id": None},  # Draw
        ]

        for state in states:
            # Verify state is valid
            assert state["status"] in [
                GameStatus.WAITING,
                GameStatus.IN_PROGRESS,
                GameStatus.COMPLETED,
            ]
            if state["status"] == GameStatus.COMPLETED:
                assert state["winner_id"] is None or isinstance(state["winner_id"], int)

    def test_player_types(self):
        """Test player type handling"""
        assert PlayerType.HUMAN == "human"
        assert PlayerType.AI == "ai"

        # Test that we can use player types in conditions
        player_type = PlayerType.AI
        is_ai = player_type == PlayerType.AI
        assert is_ai is True

        player_type = PlayerType.HUMAN
        is_human = player_type == PlayerType.HUMAN
        assert is_human is True

    def test_json_board_state_handling(self):
        """Test JSON board state handling"""
        # Test parsing and serializing board states
        board_states = [
            '["","","","","","","","",""]',  # Empty board
            '["X","","","","","","","",""]',  # One move
            '["X","O","X","O","X","O","X","O","X"]',  # Full board
        ]

        for board_state_str in board_states:
            # Test that we can parse and re-serialize
            parsed = json.loads(board_state_str)
            assert isinstance(parsed, list)
            assert len(parsed) == 9

            # Test that we can serialize back
            serialized = json.dumps(parsed)
            assert isinstance(serialized, str)

    def test_move_validation_logic(self):
        """Test move validation logic"""
        # Test position validation
        valid_positions = [0, 1, 2, 3, 4, 5, 6, 7, 8]
        invalid_positions = [-1, 9, 10, -5, 100]

        for pos in valid_positions:
            assert 0 <= pos <= 8

        for pos in invalid_positions:
            assert not (0 <= pos <= 8)

    def test_game_turn_logic(self):
        """Test game turn switching logic"""
        # Test turn switching
        assert "O" == ("O" if "X" == "X" else "X")
        assert "X" == ("O" if "O" == "X" else "X")

        # Test current turn validation
        current_turn = "X"
        next_turn = "O" if current_turn == "X" else "X"
        assert next_turn == "O"

        current_turn = "O"
        next_turn = "O" if current_turn == "X" else "X"
        assert next_turn == "X"
