from fastapi import APIRouter

from auth import UserDep
from schemas import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def read_me(current_user: UserDep):
    return current_user
