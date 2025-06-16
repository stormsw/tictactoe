from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.leaderboard import (
    LeaderboardEntry,
    LeaderboardResponse,
    UserStats,
    UserStatsResponse,
)
from app.models.user import User


class LeaderboardService:
    """Service for managing leaderboard and user statistics"""

    @staticmethod
    def get_leaderboard(db: Session, limit: int = 20) -> LeaderboardResponse:
        """Get leaderboard with top players"""
        # Query users with stats, ordered by win rate and games played
        stats_query = (
            db.query(UserStats, User)
            .join(User)
            .filter(UserStats.games_played >= 5)  # Minimum games for leaderboard
            .order_by(desc(UserStats.win_rate), desc(UserStats.games_played))
            .limit(limit)
            .all()
        )

        entries = []
        for rank, (stats, user) in enumerate(stats_query, 1):
            entries.append(
                LeaderboardEntry(
                    rank=rank,
                    user_id=user.id,
                    username=user.username,
                    games_played=stats.games_played,
                    games_won=stats.games_won,
                    games_lost=stats.games_lost,
                    games_drawn=stats.games_drawn,
                    win_rate=stats.win_rate,
                    avg_moves_per_game=stats.avg_moves_per_game,
                )
            )

        total_users = db.query(UserStats).filter(UserStats.games_played >= 5).count()

        return LeaderboardResponse(entries=entries, total_users=total_users)

    @staticmethod
    def get_user_stats(db: Session, user_id: int) -> UserStatsResponse:
        """Get statistics for a specific user"""
        stats = db.query(UserStats).filter(UserStats.user_id == user_id).first()
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise ValueError("User not found")

        if not stats:
            # Create default stats if none exist
            stats = UserStats(
                user_id=user_id,
                games_played=0,
                games_won=0,
                games_lost=0,
                games_drawn=0,
                total_moves=0,
                win_rate=0.0,
                avg_moves_per_game=0.0,
            )
            db.add(stats)
            db.commit()
            db.refresh(stats)

        return UserStatsResponse(
            user_id=user.id,
            username=user.username,
            games_played=stats.games_played,
            games_won=stats.games_won,
            games_lost=stats.games_lost,
            games_drawn=stats.games_drawn,
            total_moves=stats.total_moves,
            win_rate=stats.win_rate,
            avg_moves_per_game=stats.avg_moves_per_game,
        )
