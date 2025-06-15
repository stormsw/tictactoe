import enum
import json
from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class GameStatus(str, enum.Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class PlayerType(str, enum.Enum):
    HUMAN = "human"
    AI = "ai"


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    player1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    player2_id = Column(
        Integer, ForeignKey("users.id"), nullable=True
    )  # Can be null for AI games
    player2_type = Column(Enum(PlayerType), default=PlayerType.HUMAN)
    board_state = Column(
        Text, default='["","","","","","","","",""]'
    )  # JSON string of 3x3 board
    current_turn = Column(String(1), default="X")  # X or O
    status = Column(Enum(GameStatus), default=GameStatus.WAITING)
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_moves = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    player1 = relationship("User", foreign_keys=[player1_id])
    player2 = relationship("User", foreign_keys=[player2_id])
    winner = relationship("User", foreign_keys=[winner_id])


class GameObserver(Base):
    __tablename__ = "game_observers"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    game = relationship("Game")
    user = relationship("User")


# Pydantic models
class GameMove(BaseModel):
    position: int = Field(..., ge=0, le=8, description="Board position 0-8")


class GameCreate(BaseModel):
    class Config:
        use_enum_values = True

    player2_id: int | None = None
    player2_type: PlayerType = PlayerType.HUMAN


class GameResponse(BaseModel):
    class Config:
        use_enum_values = True

    id: int
    player1_id: int
    player2_id: int | None
    player2_type: PlayerType
    board_state: list[str]
    current_turn: str
    status: GameStatus
    winner_id: int | None
    total_moves: int
    created_at: datetime
    updated_at: datetime | None
    completed_at: datetime | None

    @classmethod
    def from_orm(cls, game: Game):
        board_state = json.loads(game.board_state) if game.board_state else [""] * 9
        return cls(
            id=game.id,
            player1_id=game.player1_id,
            player2_id=game.player2_id,
            player2_type=game.player2_type,
            board_state=board_state,
            current_turn=game.current_turn,
            status=game.status,
            winner_id=game.winner_id,
            total_moves=game.total_moves,
            created_at=game.created_at,
            updated_at=game.updated_at,
            completed_at=game.completed_at,
        )


class GameListItem(BaseModel):
    class Config:
        use_enum_values = True

    id: int
    player1_username: str
    player2_username: str | None
    player2_type: PlayerType
    status: GameStatus
    created_at: datetime
    observer_count: int = 0


class WebSocketMessage(BaseModel):
    type: str
    data: dict
