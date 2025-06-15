from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.leaderboard import LeaderboardResponse, UserStatsResponse
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.leaderboard_service import LeaderboardService

router = APIRouter()


@router.get("/", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get leaderboard with top players"""
    return LeaderboardService.get_leaderboard(db, limit)


@router.get("/user/{user_id}", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get statistics for a specific user"""
    return LeaderboardService.get_user_stats(db, user_id)


@router.get("/me", response_model=UserStatsResponse)
async def get_my_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get current user's statistics"""
    return LeaderboardService.get_user_stats(db, current_user.id)
