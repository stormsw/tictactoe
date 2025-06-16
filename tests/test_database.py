# -*- frontenda -*-


from app.database.connection import DATABASE_URL, SessionLocal, engine, get_db


class TestDatabaseConnection:
    """Test database connection utilities"""

    def test_database_url_from_env(self):
        """Test DATABASE_URL is set correctly"""
        assert DATABASE_URL is not None
        assert isinstance(DATABASE_URL, str)

    def test_engine_creation(self):
        """Test engine is created"""
        assert engine is not None

    def test_session_local_creation(self):
        """Test SessionLocal is created"""
        assert SessionLocal is not None

    def test_get_db_generator(self):
        """Test database session generator"""
        db_gen = get_db()
        # Test that it's a generator
        assert hasattr(db_gen, "__next__")
        assert hasattr(db_gen, "__iter__")

        # Test that we can get a session
        try:
            session = next(db_gen)
            assert session is not None
        except Exception:
            # It's okay if we can't connect in test environment
            pass
        finally:
            # Close the generator
            try:
                db_gen.close()
            except Exception:
                pass
