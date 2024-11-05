import os
import boto3
from fastapi import APIRouter, Request, HTTPException, status
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()
COGNITO_REGION = os.getenv("COGNITO_REGION")
COGNITO_USERPOOL_ID = os.getenv("COGNITO_USERPOOL_ID")
print(f"COGNITO_REGION loaded: {COGNITO_REGION}")

# Initialize Cognito Identity Provider client
cognito_client = boto3.client('cognito-idp', region_name=COGNITO_REGION)

router = APIRouter()




@router.get("/user", tags=["user"])
async def read_user_me(request: Request):
    return request.state.user




@router.delete("/user", tags=["user"])
async def delete_user(request: Request):
    try:
        # Delete the user from the Cognito User Pool
        cognito_client.admin_delete_user(
            UserPoolId=COGNITO_USERPOOL_ID,
            Username=request.state.user["username"]
        )
        return {"message": "User successfully deleted"}
    
    except cognito_client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))




class UpdateUserModel(BaseModel):
    birthdate: str
    name: str

@router.put("/user", tags=["user"])
async def update_user(request: Request, updated_info: UpdateUserModel):
    user_attributes = [
        {'Name': 'birthdate', 'Value': updated_info.birthdate},
        {'Name': 'name', 'Value': updated_info.name}
    ]

    try:
        cognito_client.admin_update_user_attributes(
            UserPoolId=COGNITO_USERPOOL_ID,
            Username=request.state.user["username"],
            UserAttributes=user_attributes
        )
        return {"message": "User details updated successfully"}
    
    # Exceptions
    except cognito_client.exceptions.UserNotFoundException:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
