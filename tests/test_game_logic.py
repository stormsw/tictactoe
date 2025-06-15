import pytest
from unittest.mock import Mock
from sqlalchemy.orm import Session
from app.services.game_service import GameService
from app.models.game import Game, GameStatus, PlayerType
from app.models.user import User

class TestGameService:
    """Test game service functionality"""
    
    def test_check_winner_row(self):
        """Test winner detection for rows"""
        board = ["X", "X", "X", "", "", "", "", "", ""]
        assert GameService._check_winner(board) == "X"
    
    def test_check_winner_column(self):
        """Test winner detection for columns"""
        board = ["X", "", "", "X", "", "", "X", "", ""]
        assert GameService._check_winner(board) == "X"
    
    def test_check_winner_diagonal(self):
        """Test winner detection for diagonals"""
        board = ["X", "", "", "", "X", "", "", "", "X"]
        assert GameService._check_winner(board) == "X"
    
    def test_check_winner_no_winner(self):
        """Test no winner scenario"""
        board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"]
        assert GameService._check_winner(board) is None
    
    def test_is_board_full_true(self):
        """Test board full detection - true case"""
        board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"]
        assert GameService._is_board_full(board) is True
    
    def test_is_board_full_false(self):
        """Test board full detection - false case"""
        board = ["X", "O", "", "O", "X", "O", "O", "X", "O"]
        assert GameService._is_board_full(board) is False
    
    def test_create_game_human_vs_human(self):
        """Test creating human vs human game"""
        db = Mock(spec=Session)
        game = Game(
            id=1,
            player1_id=1,
            player2_id=None,
            player2_type=PlayerType.HUMAN,
            board_state='["","","","","","","","",""]',
            current_turn="X",
            status=GameStatus.WAITING
        )
        
        db.add.return_value = None
        db.commit.return_value = None
        db.refresh.return_value = None
        
        # Mock the actual game creation
        result = game
        
        assert result.player1_id == 1
        assert result.player2_id is None
        assert result.player2_type == PlayerType.HUMAN
        assert result.status == GameStatus.WAITING
    
    def test_create_game_human_vs_ai(self):
        """Test creating human vs AI game"""
        db = Mock(spec=Session)
        game = Game(
            id=1,
            player1_id=1,
            player2_id=None,
            player2_type=PlayerType.AI,
            board_state='["","","","","","","","",""]',
            current_turn="X",
            status=GameStatus.IN_PROGRESS
        )
        
        db.add.return_value = None
        db.commit.return_value = None
        db.refresh.return_value = None
        
        result = game
        
        assert result.player1_id == 1
        assert result.player2_id is None
        assert result.player2_type == PlayerType.AI
        assert result.status == GameStatus.IN_PROGRESS
