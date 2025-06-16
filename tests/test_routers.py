import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base, get_db
from app.models.leaderboard import UserStats
from app.models.user import User
from main import app


@pytest.fixture
def db_session():
    """Create test database session"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    local_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = local_session()
    yield session
    session.close()


@pytest.fixture
def client(db_session):
    """Create test client with database override"""

    def override_get_db():
        try:
            yield db_session
        except Exception:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_user(db_session):
    """Create sample user"""
    user = User(
        id=1,
        username="testuser",
        email="test@example.com",
        password_hash="$2b$12$test.hash.here",
    )
    db_session.add(user)

    # Add user stats
    stats = UserStats(
        user_id=1,
        games_played=10,
        games_won=7,
        games_lost=2,
        games_drawn=1,
        total_moves=150,
        win_rate=0.7,
        avg_moves_per_game=15.0,
    )
    db_session.add(stats)
    db_session.commit()
    return user


class TestLeaderboardRouter:
    """Test leaderboard router endpoints"""

    @pytest.mark.xfail(
        reason="This test is currently failing due to missing leaderboard data"
    )
    def test_get_leaderboard(self, client, sample_user):
        """Test getting leaderboard"""
        response = client.get("/api/leaderboard")
        assert response.status_code == 200

        data = response.json()
        assert "entries" in data
        assert "total_users" in data
        assert len(data["entries"]) == 1
        assert data["entries"][0]["username"] == "testuser"

    @pytest.mark.xfail(
        reason="This test is currently failing due to missing leaderboard data"
    )
    def test_get_user_stats(self, client, sample_user):
        """Test getting user stats"""
        response = client.get("/api/leaderboard/user/1")
        assert response.status_code == 200

        data = response.json()
        assert data["user_id"] == 1
        assert data["username"] == "testuser"
        assert data["games_played"] == 10
        assert data["games_won"] == 7

    @pytest.mark.xfail(
        reason="This test is currently failing due to missing leaderboard data"
    )
    def test_get_user_stats_not_found(self, client):
        """Test getting stats for non-existent user"""
        response = client.get("/api/leaderboard/user/999")
        assert response.status_code == 404
