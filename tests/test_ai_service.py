from app.services.ai_service import AIService


class TestAIService:
    """Test AI service functionality"""

    def test_get_random_move_empty_board(self):
        """Test random move on empty board"""
        board = [""] * 9
        move = AIService._get_random_move(board)
        assert 0 <= move <= 8

    def test_get_random_move_partial_board(self):
        """Test random move on partially filled board"""
        board = ["X", "", "O", "", "", "", "", "", ""]
        move = AIService._get_random_move(board)
        assert move in [1, 3, 4, 5, 6, 7, 8]

    def test_get_random_move_full_board(self):
        """Test random move on full board"""
        board = ["X", "O", "X", "O", "X", "O", "X", "O", "X"]
        move = AIService._get_random_move(board)
        assert move == -1

    def test_check_winner_row(self):
        """Test winner detection for rows"""
        # Test first row
        board = ["X", "X", "X", "", "", "", "", "", ""]
        assert AIService._check_winner(board) == "X"

        # Test second row
        board = ["", "", "", "O", "O", "O", "", "", ""]
        assert AIService._check_winner(board) == "O"

    def test_check_winner_column(self):
        """Test winner detection for columns"""
        # Test first column
        board = ["X", "", "", "X", "", "", "X", "", ""]
        assert AIService._check_winner(board) == "X"

        # Test third column
        board = ["", "", "O", "", "", "O", "", "", "O"]
        assert AIService._check_winner(board) == "O"

    def test_check_winner_diagonal(self):
        """Test winner detection for diagonals"""
        # Test main diagonal
        board = ["X", "", "", "", "X", "", "", "", "X"]
        assert AIService._check_winner(board) == "X"

        # Test anti-diagonal
        board = ["", "", "O", "", "O", "", "O", "", ""]
        assert AIService._check_winner(board) == "O"

    def test_check_winner_no_winner(self):
        """Test no winner scenario"""
        board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"]
        assert AIService._check_winner(board) is None

    def test_is_board_full_true(self):
        """Test board full detection - true case"""
        board = ["X", "O", "X", "O", "X", "O", "O", "X", "O"]
        assert AIService._is_board_full(board) is True

    def test_is_board_full_false(self):
        """Test board full detection - false case"""
        board = ["X", "O", "", "O", "X", "O", "O", "X", "O"]
        assert AIService._is_board_full(board) is False

    def test_optimal_move_winning(self):
        """Test AI takes winning move"""
        # AI (O) can win by playing position 2
        board = ["O", "O", "", "X", "X", "", "", "", ""]
        move = AIService._get_optimal_move(board)
        assert move == 2

    def test_optimal_move_blocking(self):
        """Test AI blocks opponent's winning move"""
        # Human (X) can win by playing position 2, AI should block
        board = ["X", "X", "", "O", "", "", "", "", ""]
        move = AIService._get_optimal_move(board)
        assert move == 2

    def test_get_ai_move_easy(self):
        """Test easy difficulty returns random move"""
        board = [""] * 9
        move = AIService.get_ai_move(board, "easy")
        assert 0 <= move <= 8

    def test_get_ai_move_medium_difficulty(self):
        """Test medium difficulty AI move"""
        board = ["X", "", "", "", "", "", "", "", ""]
        move = AIService.get_ai_move(board, "medium")
        assert 0 <= move <= 8
        assert board[move] == ""  # Valid empty position

    def test_get_ai_move_hard_difficulty(self):
        """Test hard difficulty AI move"""
        board = ["X", "", "", "", "", "", "", "", ""]
        move = AIService.get_ai_move(board, "hard")
        assert 0 <= move <= 8
        assert board[move] == ""  # Valid empty position

    def test_get_medium_move_random_path(self):
        """Test medium move can take random path"""
        board = ["", "", "", "", "", "", "", "", ""]
        # We can't guarantee which path it takes, but it should return a valid move
        move = AIService._get_medium_move(board)
        assert 0 <= move <= 8

    def test_get_medium_move_optimal_path(self):
        """Test medium move takes optimal path"""
        # Create a scenario where AI should block player from winning
        board = ["X", "X", "", "", "", "", "", "", ""]
        # In medium mode, 70% of the time it should play optimally (block at position 2)
        # We'll run this multiple times to increase chance of hitting the optimal path
        optimal_moves_found = 0
        for _ in range(10):
            move = AIService._get_medium_move(board)
            if move == 2:  # Optimal blocking move
                optimal_moves_found += 1
        # At least some should be optimal (this is probabilistic but very likely)
        assert optimal_moves_found > 0

    def test_edge_case_empty_line_38(self):
        """Test the specific line 38 that shows as uncovered"""
        board = ["", "", "", "", "", "", "", "", ""]
        # This should test the else clause in _get_medium_move
        move = AIService._get_medium_move(board)
        assert 0 <= move <= 8
