import random


class AIService:
    """AI service for computer opponents with different difficulty levels"""

    @staticmethod
    def get_ai_move(board_state: list[str], difficulty: str = "medium") -> int:
        """
        Get AI move based on difficulty level

        Args:
            board_state: Current board state as list of 9 strings
            difficulty: "easy", "medium", or "hard"

        Returns:
            Position (0-8) for AI move
        """
        if difficulty == "easy":
            return AIService._get_random_move(board_state)
        elif difficulty == "medium":
            return AIService._get_medium_move(board_state)
        else:  # hard
            return AIService._get_optimal_move(board_state)

    @staticmethod
    def _get_random_move(board_state: list[str]) -> int:
        """Get random valid move"""
        empty_positions = [i for i, cell in enumerate(board_state) if cell == ""]
        return random.choice(empty_positions) if empty_positions else -1

    @staticmethod
    def _get_medium_move(board_state: list[str]) -> int:
        """Medium difficulty: 70% optimal, 30% random"""
        if random.random() < 0.7:
            return AIService._get_optimal_move(board_state)
        else:
            return AIService._get_random_move(board_state)

    @staticmethod
    def _get_optimal_move(board_state: list[str]) -> int:
        """Get optimal move using minimax algorithm"""

        def minimax(
            board: list[str],
            depth: int,
            is_maximizing: bool,
            alpha: float = float("-inf"),
            beta: float = float("inf"),
        ) -> float:
            winner = AIService._check_winner(board)

            if winner == "O":  # AI wins
                return 10 - depth
            elif winner == "X":  # Human wins
                return depth - 10
            elif AIService._is_board_full(board):  # Draw
                return 0

            if is_maximizing:  # AI turn
                max_eval = float("-inf")
                for i in range(9):
                    if board[i] == "":
                        board[i] = "O"
                        eval_score = minimax(board, depth + 1, False, alpha, beta)
                        board[i] = ""
                        max_eval = max(max_eval, eval_score)
                        alpha = max(alpha, eval_score)
                        if beta <= alpha:
                            break
                return max_eval
            else:  # Human turn
                min_eval = float("inf")
                for i in range(9):
                    if board[i] == "":
                        board[i] = "X"
                        eval_score = minimax(board, depth + 1, True, alpha, beta)
                        board[i] = ""
                        min_eval = min(min_eval, eval_score)
                        beta = min(beta, eval_score)
                        if beta <= alpha:
                            break
                return min_eval

        best_move = -1
        best_value = float("-inf")

        for i in range(9):
            if board_state[i] == "":
                board_state[i] = "O"
                move_value = minimax(board_state, 0, False)
                board_state[i] = ""

                if move_value > best_value:
                    best_value = move_value
                    best_move = i

        return best_move if best_move != -1 else AIService._get_random_move(board_state)

    @staticmethod
    def _check_winner(board: list[str]) -> str | None:
        """Check if there's a winner on the board"""
        winning_combinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],  # Rows
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],  # Columns
            [0, 4, 8],
            [2, 4, 6],  # Diagonals
        ]

        for combo in winning_combinations:
            if board[combo[0]] == board[combo[1]] == board[combo[2]] != "":
                return board[combo[0]]

        return None

    @staticmethod
    def _is_board_full(board: list[str]) -> bool:
        """Check if board is full"""
        return all(cell != "" for cell in board)
