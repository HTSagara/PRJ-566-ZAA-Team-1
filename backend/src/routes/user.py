
from fastapi import APIRouter, Depends, Request, HTTPException, status
from ..auth import verify_jwt_token, auth_middleware, get_user_info
from pydantic import BaseModel
import requests
from fastapi import APIRouter, Depends, Request, HTTPException, status
from dotenv import load_dotenv
from typing import Optional
import os
import boto3

# Load environment variables from the .env file
load_dotenv()

COGNITO_REGION = os.getenv("COGNITO_REGION")
COGNITO_USERPOOL_ID = os.getenv("COGNITO_USERPOOL_ID")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Debugging prints to verify
print(f"COGNITO_REGION: {COGNITO_REGION}")
print(f"COGNITO_USERPOOL_ID: {COGNITO_USERPOOL_ID}")


# These routes are protected by auth_middleware
router = APIRouter(dependencies=[Depends(auth_middleware)])

# Initialize Cognito Identity Provider client
cognito_client = boto3.client('cognito-idp', region_name=COGNITO_REGION)


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


@router.delete("/users/", tags=["users"])
async def delete_user(request: Request):
    # Extract token from the auth middleware
    token = request.headers.get("Authorization").split(" ")[1]
    
    # Get the user's 'sub' from the decoded JWT payload
    decoded_token = verify_jwt_token(token)
    username = decoded_token.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User identifier not found in token")
    
    try:
        # Delete the user from the Cognito User Pool
        cognito_client.admin_delete_user(
            UserPoolId=COGNITO_USERPOOL_ID,
            Username=username
        )
        return {"message": "User successfully deleted"}
    
    except cognito_client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


class UpdateUserModel(BaseModel):
    birthdate: str
    email: str
    name: str

@router.put("/user", tags=["users"])
async def update_user(request: Request, updated_info: UpdateUserModel):
    # Get the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization header missing or invalid")

    access_token = auth_header.split(" ")[1]

    decoded_token = verify_jwt_token(access_token)
    username = decoded_token.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User identifier not found in token")

    user_attributes = [
        {'Name': 'birthdate', 'Value': updated_info.birthdate},
        {'Name': 'email', 'Value': updated_info.email},
        {'Name': 'name', 'Value': updated_info.name}
    ]

    try:
        cognito_client.admin_update_user_attributes(
            UserPoolId=COGNITO_USERPOOL_ID,
            Username=username,
            UserAttributes=user_attributes
        )
        return {"message": "User details updated successfully"}
    
    # Exceptions
    except cognito_client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
