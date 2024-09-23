from fastapi import APIRouter, Depends, Request, HTTPException, status
from ..auth import verify_jwt_token, auth_middleware, get_user_info
import requests

# These routes are protected by auth_middleware
router = APIRouter(dependencies=[Depends(auth_middleware)])


# Dummy user routes
@router.get("/users/", tags=["users"])
async def read_users():
    return [{"username": "Rick"}, {"username": "Morty"}]


@router.get("/users/me", tags=["users"])
async def read_user_me(request: Request):
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    # Extract access token from the header ("Bearer <token>")
    access_token = auth_header.split(" ")[1]

    # Retrieve user info from Cognito using boto3
    user_info = get_user_info(access_token)

    return user_info


@router.get("/users/{username}", tags=["users"])
async def read_user(username: str):
    return {"username": username}


