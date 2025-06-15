"""Seed test user

Revision ID: a890291a707f
Revises: d7ad0e2ba7e0
Create Date: 2025-06-15 14:39:32.294172

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a890291a707f'
down_revision: Union[str, None] = 'd7ad0e2ba7e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed test user."""
    from datetime import datetime
    from passlib.context import CryptContext
    
    # Initialize password hashing
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash("test")
    
    # Create users table reference
    users_table = sa.table('users',
        sa.column('username', sa.String),
        sa.column('email', sa.String),
        sa.column('password_hash', sa.String),
        sa.column('is_active', sa.Boolean),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )
    
    # Create user_stats table reference
    user_stats_table = sa.table('user_stats',
        sa.column('user_id', sa.Integer),
        sa.column('games_played', sa.Integer),
        sa.column('games_won', sa.Integer),
        sa.column('games_lost', sa.Integer),
        sa.column('games_drawn', sa.Integer),
        sa.column('total_moves', sa.Integer),
        sa.column('created_at', sa.DateTime),
        sa.column('updated_at', sa.DateTime)
    )
    
    # Insert test user
    connection = op.get_bind()
    
    # Check if user already exists
    result = connection.execute(
        sa.text("SELECT id FROM users WHERE username = 'test'")
    ).fetchone()
    
    if not result:
        # Insert test user
        result = connection.execute(
            users_table.insert().values(
                username='test',
                email='test@example.com',
                password_hash=hashed_password,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ).returning(sa.text('id'))
        )
        user_id = result.fetchone()[0]
        
        # Insert initial user stats
        connection.execute(
            user_stats_table.insert().values(
                user_id=user_id,
                games_played=0,
                games_won=0,
                games_lost=0,
                games_drawn=0,
                total_moves=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        )
        
        print("✅ Created test user: test/test")
    else:
        print("⚠️  Test user already exists")


def downgrade() -> None:
    """Remove test user."""
    connection = op.get_bind()
    
    # Get test user ID
    result = connection.execute(
        sa.text("SELECT id FROM users WHERE username = 'test'")
    ).fetchone()
    
    if result:
        user_id = result[0]
        
        # Delete user stats
        connection.execute(
            sa.text("DELETE FROM user_stats WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        
        # Delete user
        connection.execute(
            sa.text("DELETE FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        )
        
        print("🗑️  Removed test user")
