from fastapi import APIRouter, Depends

from ..auth import auth_middleware

# These routes are protected by auth_middleware
router = APIRouter(dependencies=[Depends(auth_middleware)])

# These are dummy user routes
@router.get("/users/", tags=["users"])
async def read_users():
    return [{"username": "Rick"}, {"username": "Morty"}]


@router.get("/users/me", tags=["users"])
async def read_user_me():
    return {"username": "fakecurrentuser"}


@router.get("/users/{username}", tags=["users"])
async def read_user(username: str):
    return {"username": username}
