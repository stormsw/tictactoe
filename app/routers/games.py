from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.game import GameCreate, GameListItem, GameMove, GameResponse
from app.models.user import User
from app.routers.auth import get_current_user
from app.routers.websocket import get_websocket_manager
from app.services.game_service import GameService

router = APIRouter()


@router.get("/", response_model=list[GameListItem])
async def get_active_games(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of active games"""
    return GameService.get_active_games(db, limit)


@router.post("/", response_model=GameResponse)
async def create_game(
    game_data: GameCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new game"""
    game = GameService.create_game(
        db, current_user.id, game_data.player2_id, game_data.player2_type
    )

    # Notify all users about the new game
    websocket_manager = get_websocket_manager()
    await websocket_manager.notify_games_list_update()

    return GameResponse.from_orm(game)


@router.get("/{game_id}", response_model=GameResponse)
async def get_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get game details"""
    game = GameService.get_game(db, game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Game not found"
        )
    return GameResponse.from_orm(game)


@router.post("/{game_id}/join", response_model=GameResponse)
async def join_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a game as player 2"""
    game = GameService.join_game(db, game_id, current_user.id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot join this game"
        )

    # Notify about game update and games list update
    websocket_manager = get_websocket_manager()
    await websocket_manager.notify_game_update(
        game_id, GameResponse.from_orm(game).dict()
    )
    await websocket_manager.notify_games_list_update()

    return GameResponse.from_orm(game)


@router.post("/{game_id}/observe")
async def observe_game(
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Join a game as observer"""
    success = GameService.add_observer(db, game_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot observe this game"
        )

    # Add user to game observers in Redis through WebSocket manager
    websocket_manager = get_websocket_manager()
    await websocket_manager.redis_manager.add_game_observer(game_id, current_user.id)

    return {"message": "Successfully joined as observer"}


@router.post("/{game_id}/move", response_model=GameResponse)
async def make_move(
    game_id: int,
    move: GameMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Make a move in the game"""
    game, message = GameService.make_move(db, game_id, current_user.id, move.position)
    if not game:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Notify all observers about the game update
    websocket_manager = get_websocket_manager()
    await websocket_manager.notify_game_update(
        game_id, GameResponse.from_orm(game).dict()
    )

    # If game ended, also update the games list
    if game.status in ["finished", "draw"]:
        await websocket_manager.notify_games_list_update()

    return GameResponse.from_orm(game)
