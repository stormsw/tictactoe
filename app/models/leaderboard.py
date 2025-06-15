from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.connection import Base
from pydantic import BaseModel
from datetime import datetime

class UserStats(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    games_played = Column(Integer, default=0)
    games_won = Column(Integer, default=0)
    games_lost = Column(Integer, default=0)
    games_drawn = Column(Integer, default=0)
    total_moves = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    avg_moves_per_game = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")

# Pydantic models
class UserStatsResponse(BaseModel):
    user_id: int
    username: str
    games_played: int
    games_won: int
    games_lost: int
    games_drawn: int
    total_moves: int
    win_rate: float
    avg_moves_per_game: float

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    games_played: int
    games_won: int
    games_lost: int
    games_drawn: int
    win_rate: float
    avg_moves_per_game: float

class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    total_users: int
