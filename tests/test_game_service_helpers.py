from app.services.game_service import GameService


class TestGameServiceHelperMethods:
    """Test game service helper methods that don't require database"""

    def test_check_winner_row_first(self):
        """Test winner detection for first row"""
        board = ["X", "X", "X", "", "", "", "", "", ""]
        assert GameService._check_winner(board) == "X"

    def test_check_winner_row_second(self):
        """Test winner detection for second row"""
        board = ["", "", "", "O", "O", "O", "", "", ""]
        assert GameService._check_winner(board) == "O"

    def test_check_winner_row_third(self):
        """Test winner detection for third row"""
        board = ["", "", "", "", "", "", "X", "X", "X"]
        assert GameService._check_winner(board) == "X"

    def test_check_winner_column_first(self):
        """Test winner detection for first column"""
        board = ["O", "", "", "O", "", "", "O", "", ""]
        assert GameService._check_winner(board) == "O"

    def test_check_winner_column_second(self):
        """Test winner detection for second column"""
        board = ["", "X", "", "", "X", "", "", "X", ""]
        assert GameService._check_winner(board) == "X"

    def test_check_winner_column_third(self):
        """Test winner detection for third column"""
        board = ["", "", "O", "", "", "O", "", "", "O"]
        assert GameService._check_winner(board) == "O"

    def test_check_winner_diagonal_main(self):
        """Test winner detection for main diagonal"""
        board = ["X", "", "", "", "X", "", "", "", "X"]
        assert GameService._check_winner(board) == "X"

    def test_check_winner_diagonal_anti(self):
        """Test winner detection for anti-diagonal"""
        board = ["", "", "O", "", "O", "", "O", "", ""]
        assert GameService._check_winner(board) == "O"

    def test_check_winner_none(self):
        """Test no winner scenario"""
        board = ["X", "O", "X", "O", "", "", "", "", ""]
        assert GameService._check_winner(board) is None

    def test_check_winner_empty_board(self):
        """Test empty board has no winner"""
        board = ["", "", "", "", "", "", "", "", ""]
        assert GameService._check_winner(board) is None

    def test_is_board_full_true(self):
        """Test board full detection when board is full"""
        board = ["X", "O", "X", "O", "X", "O", "X", "O", "X"]
        assert GameService._is_board_full(board) is True

    def test_is_board_full_false(self):
        """Test board full detection when board has empty spaces"""
        board = ["X", "O", "X", "O", "X", "O", "X", "O", ""]
        assert GameService._is_board_full(board) is False

    def test_is_board_full_empty(self):
        """Test board full detection on empty board"""
        board = ["", "", "", "", "", "", "", "", ""]
        assert GameService._is_board_full(board) is False

    def test_is_board_full_one_empty(self):
        """Test board full detection with one empty cell"""
        board = ["X", "O", "X", "O", "X", "O", "X", "O", ""]
        assert GameService._is_board_full(board) is False

    def test_mixed_scenarios(self):
        """Test various board scenarios"""
        # Almost full board with no winner
        board = ["X", "O", "X", "O", "O", "X", "O", "X", ""]
        assert GameService._check_winner(board) is None
        assert GameService._is_board_full(board) is False

        # Full board with winner
        board = ["X", "O", "X", "X", "X", "X", "O", "X", "O"]
        assert GameService._check_winner(board) == "X"
        assert GameService._is_board_full(board) is True
