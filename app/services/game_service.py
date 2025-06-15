import json
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.game import (
    Game,
    GameListItem,
    GameObserver,
    GameStatus,
    PlayerType,
)
from app.models.leaderboard import UserStats
from app.models.user import User
from app.services.ai_service import AIService


class GameService:
    """Service for managing game logic and operations"""

    @staticmethod
    def create_game(
        db: Session,
        player1_id: int,
        player2_id: int | None = None,
        player2_type: PlayerType = PlayerType.HUMAN,
    ) -> Game:
        """Create a new game"""
        game = Game(
            player1_id=player1_id,
            player2_id=player2_id,
            player2_type=player2_type,
            board_state='["","","","","","","","",""]',
            current_turn="X",
            status=(
                GameStatus.WAITING
                if player2_type == PlayerType.HUMAN and not player2_id
                else GameStatus.IN_PROGRESS
            ),
        )
        db.add(game)
        db.commit()
        db.refresh(game)
        return game

    @staticmethod
    def get_game(db: Session, game_id: int) -> Game | None:
        """Get game by ID"""
        return db.query(Game).filter(Game.id == game_id).first()

    @staticmethod
    def get_active_games(db: Session, limit: int = 50) -> list[GameListItem]:
        """Get list of active games"""
        games = (
            db.query(Game)
            .filter(Game.status.in_([GameStatus.WAITING, GameStatus.IN_PROGRESS]))
            .order_by(Game.created_at.desc())
            .limit(limit)
            .all()
        )

        result = []
        for game in games:
            # Get observer count
            observer_count = (
                db.query(GameObserver).filter(GameObserver.game_id == game.id).count()
            )

            # Get usernames
            player1_username = (
                db.query(User.username).filter(User.id == game.player1_id).scalar()
            )
            player2_username = None
            if game.player2_id:
                player2_username = (
                    db.query(User.username).filter(User.id == game.player2_id).scalar()
                )
            elif game.player2_type == PlayerType.AI:
                player2_username = "AI"

            result.append(
                GameListItem(
                    id=game.id,
                    player1_username=player1_username or "Unknown",
                    player2_username=player2_username,
                    player2_type=game.player2_type,
                    status=game.status,
                    created_at=game.created_at,
                    observer_count=observer_count,
                )
            )

        return result

    @staticmethod
    def join_game(db: Session, game_id: int, user_id: int) -> Game | None:
        """Join an existing game as player 2"""
        game = GameService.get_game(db, game_id)
        if not game or game.status != GameStatus.WAITING or game.player2_id:
            return None

        game.player2_id = user_id
        game.status = GameStatus.IN_PROGRESS
        db.commit()
        db.refresh(game)
        return game

    @staticmethod
    def add_observer(db: Session, game_id: int, user_id: int) -> bool:
        """Add observer to a game"""
        # Check if already observing
        existing = (
            db.query(GameObserver)
            .filter(GameObserver.game_id == game_id, GameObserver.user_id == user_id)
            .first()
        )

        if existing:
            return True

        observer = GameObserver(game_id=game_id, user_id=user_id)
        db.add(observer)
        db.commit()
        return True

    @staticmethod
    def make_move(
        db: Session, game_id: int, user_id: int, position: int
    ) -> tuple[Game | None, str]:
        """Make a move in the game"""
        game = GameService.get_game(db, game_id)
        if not game:
            return None, "Game not found"

        if game.status != GameStatus.IN_PROGRESS:
            return None, "Game is not in progress"

        # Check if it's the user's turn
        if (game.current_turn == "X" and game.player1_id != user_id) or (
            game.current_turn == "O" and game.player2_id != user_id
        ):
            return None, "Not your turn"

        # Parse board state
        board_state = json.loads(game.board_state)

        # Check if position is valid
        if position < 0 or position > 8 or board_state[position] != "":
            return None, "Invalid move"

        # Make the move
        board_state[position] = game.current_turn
        game.board_state = json.dumps(board_state)
        game.total_moves += 1

        # Check for winner
        winner = GameService._check_winner(board_state)
        if winner:
            game.status = GameStatus.COMPLETED
            game.completed_at = datetime.utcnow()
            if winner == "X":
                game.winner_id = game.player1_id
            elif winner == "O":
                game.winner_id = game.player2_id
            GameService._update_user_stats(db, game)
        elif GameService._is_board_full(board_state):
            # Draw
            game.status = GameStatus.COMPLETED
            game.completed_at = datetime.utcnow()
            GameService._update_user_stats(db, game)
        else:
            # Switch turns
            game.current_turn = "O" if game.current_turn == "X" else "X"

        db.commit()
        db.refresh(game)

        # If it's AI's turn and game is still in progress
        if (
            game.status == GameStatus.IN_PROGRESS
            and game.player2_type == PlayerType.AI
            and game.current_turn == "O"
        ):
            return GameService._make_ai_move(db, game)

        return game, "Move successful"

    @staticmethod
    def _make_ai_move(db: Session, game: Game) -> tuple[Game, str]:
        """Make AI move"""
        board_state = json.loads(game.board_state)
        ai_position = AIService.get_ai_move(board_state, "medium")

        if ai_position == -1:
            return game, "No valid AI move"

        # Make AI move
        board_state[ai_position] = "O"
        game.board_state = json.dumps(board_state)
        game.total_moves += 1

        # Check for winner
        winner = GameService._check_winner(board_state)
        if winner:
            game.status = GameStatus.COMPLETED
            game.completed_at = datetime.utcnow()
            if winner == "O":
                game.winner_id = None  # AI won
            GameService._update_user_stats(db, game)
        elif GameService._is_board_full(board_state):
            # Draw
            game.status = GameStatus.COMPLETED
            game.completed_at = datetime.utcnow()
            GameService._update_user_stats(db, game)
        else:
            # Switch back to player
            game.current_turn = "X"

        db.commit()
        db.refresh(game)
        return game, "AI move successful"

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

    @staticmethod
    def _update_user_stats(db: Session, game: Game) -> None:
        """Update user statistics after game completion"""

        def update_stats(user_id: int, won: bool, lost: bool, drawn: bool):
            stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
            if not stats:
                stats = UserStats(user_id=user_id)
                db.add(stats)

            stats.games_played += 1
            stats.total_moves += game.total_moves

            if won:
                stats.games_won += 1
            elif lost:
                stats.games_lost += 1
            elif drawn:
                stats.games_drawn += 1

            # Calculate win rate
            if stats.games_played > 0:
                stats.win_rate = stats.games_won / stats.games_played
                stats.avg_moves_per_game = stats.total_moves / stats.games_played

        # Update player 1 stats
        if game.winner_id == game.player1_id:
            update_stats(game.player1_id, True, False, False)
        elif game.winner_id is None:  # Draw or AI won
            if (
                game.player2_type == PlayerType.AI
                and game.status == GameStatus.COMPLETED
            ):
                # Check if it's a draw
                board_state = json.loads(game.board_state)
                if GameService._is_board_full(
                    board_state
                ) and not GameService._check_winner(board_state):
                    update_stats(game.player1_id, False, False, True)  # Draw
                else:
                    update_stats(game.player1_id, False, True, False)  # Lost to AI
            else:
                update_stats(game.player1_id, False, False, True)  # Draw
        else:
            update_stats(game.player1_id, False, True, False)

        # Update player 2 stats (if human)
        if game.player2_id and game.player2_type == PlayerType.HUMAN:
            if game.winner_id == game.player2_id:
                update_stats(game.player2_id, True, False, False)
            elif game.winner_id is None:
                update_stats(game.player2_id, False, False, True)  # Draw
            else:
                update_stats(game.player2_id, False, True, False)

        db.commit()
