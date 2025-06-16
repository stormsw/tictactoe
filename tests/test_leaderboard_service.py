import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.models.leaderboard import UserStats
from app.models.user import User
from app.services.leaderboard_service import LeaderboardService


@pytest.fixture
def db_session():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    local_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = local_session()
    yield session
    session.close()


@pytest.fixture
def sample_users(db_session):
    """Create sample users for testing"""
    users = [
        User(id=1, username="player1", email="player1@test.com", password_hash="hash1"),
        User(id=2, username="player2", email="player2@test.com", password_hash="hash2"),
        User(id=3, username="player3", email="player3@test.com", password_hash="hash3"),
        User(id=4, username="newbie", email="newbie@test.com", password_hash="hash4"),
    ]

    for user in users:
        db_session.add(user)

    db_session.commit()
    return users


@pytest.fixture
def sample_stats(db_session, sample_users):
    """Create sample user stats for testing"""
    stats = [
        UserStats(
            user_id=1,
            games_played=10,
            games_won=8,
            games_lost=2,
            games_drawn=0,
            total_moves=120,
            win_rate=0.8,
            avg_moves_per_game=12.0,
        ),
        UserStats(
            user_id=2,
            games_played=15,
            games_won=9,
            games_lost=4,
            games_drawn=2,
            total_moves=180,
            win_rate=0.6,
            avg_moves_per_game=12.0,
        ),
        UserStats(
            user_id=3,
            games_played=20,
            games_won=10,
            games_lost=8,
            games_drawn=2,
            total_moves=240,
            win_rate=0.5,
            avg_moves_per_game=12.0,
        ),
        UserStats(
            user_id=4,
            games_played=2,
            games_won=1,
            games_lost=1,
            games_drawn=0,
            total_moves=24,
            win_rate=0.5,
            avg_moves_per_game=12.0,
        ),
    ]

    for stat in stats:
        db_session.add(stat)

    db_session.commit()
    return stats


class TestLeaderboardService:
    """Test leaderboard service functionality"""

    def test_get_leaderboard_default_limit(
        self, db_session, sample_users, sample_stats
    ):
        """Test getting leaderboard with default limit"""
        result = LeaderboardService.get_leaderboard(db_session)

        assert len(result.entries) == 3  # Only users with >= 5 games
        assert result.total_users == 3

        # Check ordering by win rate, then by games played
        assert result.entries[0].username == "player1"  # 80% win rate
        assert result.entries[0].rank == 1
        assert result.entries[1].username == "player2"  # 60% win rate
        assert result.entries[1].rank == 2
        assert result.entries[2].username == "player3"  # 50% win rate, 20 games
        assert result.entries[2].rank == 3

    def test_get_leaderboard_custom_limit(self, db_session, sample_users, sample_stats):
        """Test getting leaderboard with custom limit"""
        result = LeaderboardService.get_leaderboard(db_session, limit=2)

        assert len(result.entries) == 2
        assert result.total_users == 3
        assert result.entries[0].username == "player1"
        assert result.entries[1].username == "player2"

    def test_get_leaderboard_empty_db(self, db_session):
        """Test getting leaderboard with empty database"""
        result = LeaderboardService.get_leaderboard(db_session)

        assert len(result.entries) == 0
        assert result.total_users == 0

    def test_get_user_stats_existing_user(self, db_session, sample_users, sample_stats):
        """Test getting stats for existing user"""
        result = LeaderboardService.get_user_stats(db_session, user_id=1)

        assert result.user_id == 1
        assert result.username == "player1"
        assert result.games_played == 10
        assert result.games_won == 8
        assert result.games_lost == 2
        assert result.games_drawn == 0
        assert result.total_moves == 120
        assert result.win_rate == 0.8
        assert result.avg_moves_per_game == 12.0

    def test_get_user_stats_user_not_found(self, db_session):
        """Test getting stats for non-existent user"""
        with pytest.raises(ValueError, match="User not found"):
            LeaderboardService.get_user_stats(db_session, user_id=999)

    def test_get_user_stats_no_existing_stats(self, db_session, sample_users):
        """Test getting stats for user without existing stats"""
        result = LeaderboardService.get_user_stats(db_session, user_id=1)

        assert result.user_id == 1
        assert result.username == "player1"
        assert result.games_played == 0
        assert result.games_won == 0
        assert result.games_lost == 0
        assert result.games_drawn == 0
        assert result.total_moves == 0
        assert result.win_rate == 0.0
        assert result.avg_moves_per_game == 0.0

        # Verify stats were created in database
        stats = db_session.query(UserStats).filter(UserStats.user_id == 1).first()
        assert stats is not None
        assert stats.games_played == 0
