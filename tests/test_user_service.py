from datetime import datetime, timedelta

import pytest
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database.connection import Base
from app.models.user import UserCreate
from app.services.user_service import UserService


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
def sample_user_data():
    """Sample user data for testing"""
    return UserCreate(
        username="testuser", email="test@example.com", password="testpassword123"
    )


@pytest.fixture
def sample_user(db_session, sample_user_data):
    """Create a sample user in the database"""
    user = UserService.create_user(db_session, sample_user_data)
    return user


class TestUserService:
    """Test user service functionality"""

    def test_get_password_hash(self):
        """Test password hashing"""
        password = "testpassword"
        hashed = UserService.get_password_hash(password)

        assert hashed != password
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        """Test password verification with correct password"""
        password = "testpassword"
        hashed = UserService.get_password_hash(password)

        assert UserService.verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password"""
        password = "testpassword"
        wrong_password = "wrongpassword"
        hashed = UserService.get_password_hash(password)

        assert UserService.verify_password(wrong_password, hashed) is False

    def test_create_user(self, db_session, sample_user_data):
        """Test user creation"""
        user = UserService.create_user(db_session, sample_user_data)

        assert user.id is not None
        assert user.username == sample_user_data.username
        assert user.email == sample_user_data.email
        assert user.password_hash != sample_user_data.password
        assert user.is_active is True
        assert user.created_at is not None

    def test_get_user_by_username_existing(self, db_session, sample_user):
        """Test getting existing user by username"""
        user = UserService.get_user_by_username(db_session, sample_user.username)

        assert user is not None
        assert user.id == sample_user.id
        assert user.username == sample_user.username

    def test_get_user_by_username_non_existing(self, db_session):
        """Test getting non-existing user by username"""
        user = UserService.get_user_by_username(db_session, "nonexistent")

        assert user is None

    def test_get_user_by_email_existing(self, db_session, sample_user):
        """Test getting existing user by email"""
        user = UserService.get_user_by_email(db_session, sample_user.email)

        assert user is not None
        assert user.id == sample_user.id
        assert user.email == sample_user.email

    def test_get_user_by_email_non_existing(self, db_session):
        """Test getting non-existing user by email"""
        user = UserService.get_user_by_email(db_session, "nonexistent@example.com")

        assert user is None

    def test_get_user_by_id_existing(self, db_session, sample_user):
        """Test getting existing user by ID"""
        user = UserService.get_user_by_id(db_session, sample_user.id)

        assert user is not None
        assert user.id == sample_user.id
        assert user.username == sample_user.username

    def test_get_user_by_id_non_existing(self, db_session):
        """Test getting non-existing user by ID"""
        user = UserService.get_user_by_id(db_session, 999)

        assert user is None

    def test_authenticate_user_correct_credentials(
        self, db_session, sample_user, sample_user_data
    ):
        """Test user authentication with correct credentials"""
        user = UserService.authenticate_user(
            db_session, sample_user_data.username, sample_user_data.password
        )

        assert user is not None
        assert user.id == sample_user.id

    def test_authenticate_user_wrong_password(self, db_session, sample_user):
        """Test user authentication with wrong password"""
        user = UserService.authenticate_user(
            db_session, sample_user.username, "wrongpassword"
        )

        assert user is None

    def test_authenticate_user_wrong_username(self, db_session):
        """Test user authentication with wrong username"""
        user = UserService.authenticate_user(db_session, "wronguser", "anypassword")

        assert user is None

    def test_create_access_token_default_expiry(self):
        """Test creating access token with default expiry"""
        data = {"sub": "testuser"}
        token = UserService.create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Decode to verify structure
        from app.services.user_service import ALGORITHM, SECRET_KEY

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"
        assert "exp" in payload

    def test_create_access_token_custom_expiry(self):
        """Test creating access token with custom expiry"""
        data = {"sub": "testuser"}
        expires_delta = timedelta(minutes=60)
        token = UserService.create_access_token(data, expires_delta)

        assert isinstance(token, str)

        from app.services.user_service import ALGORITHM, SECRET_KEY

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "testuser"

        # Check that expiry is set and is in the future
        assert "exp" in payload
        exp_time = datetime.fromtimestamp(payload["exp"])
        now = datetime.utcnow()
        assert exp_time > now

    def test_get_user_from_token_valid(self, db_session, sample_user):
        """Test getting user from valid token"""
        data = {"sub": sample_user.username}
        token = UserService.create_access_token(data)

        user = UserService.get_user_from_token(db_session, token)

        assert user is not None
        assert user.id == sample_user.id
        assert user.username == sample_user.username

    def test_get_user_from_token_invalid(self, db_session):
        """Test getting user from invalid token"""
        invalid_token = "invalid.jwt.token"

        user = UserService.get_user_from_token(db_session, invalid_token)

        assert user is None

    def test_get_user_from_token_expired(self, db_session, sample_user):
        """Test getting user from expired token"""
        data = {"sub": sample_user.username}
        expires_delta = timedelta(seconds=-1)  # Already expired
        token = UserService.create_access_token(data, expires_delta)

        user = UserService.get_user_from_token(db_session, token)

        assert user is None

    def test_get_user_from_token_no_subject(self, db_session):
        """Test getting user from token without subject"""
        data = {"other": "data"}
        token = UserService.create_access_token(data)

        user = UserService.get_user_from_token(db_session, token)

        assert user is None

    def test_get_user_from_token_nonexistent_user(self, db_session):
        """Test getting user from token with non-existent username"""
        data = {"sub": "nonexistentuser"}
        token = UserService.create_access_token(data)

        user = UserService.get_user_from_token(db_session, token)

        assert user is None
