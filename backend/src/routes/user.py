import boto3
from fastapi import APIRouter, Depends, Request, HTTPException, status
from ..auth import auth_middleware, verify_jwt_token
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()

COGNITO_REGION = os.getenv("COGNITO_REGION")
COGNITO_USERPOOL_ID = os.getenv("COGNITO_USERPOOL_ID")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Debugging prints to verify
print(f"COGNITO_REGION: {COGNITO_REGION}")
print(f"COGNITO_USERPOOL_ID: {COGNITO_USERPOOL_ID}")

# Initialize Cognito Identity Provider client
cognito_client = boto3.client('cognito-idp', region_name=COGNITO_REGION)


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
